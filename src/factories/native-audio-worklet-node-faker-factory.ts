import { MOST_NEGATIVE_SINGLE_FLOAT, MOST_POSITIVE_SINGLE_FLOAT } from '../constants';
import { AUXILIARY_GAIN_NODE_STORE } from '../globals';
import { computeBufferSize } from '../helpers/compute-buffer-size';
import { copyFromChannel } from '../helpers/copy-from-channel';
import { copyToChannel } from '../helpers/copy-to-channel';
import { createAudioWorkletProcessor } from '../helpers/create-audio-worklet-processor';
import { createNestedArrays } from '../helpers/create-nested-arrays';
import { IAudioWorkletProcessor } from '../interfaces';
import { ReadOnlyMap } from '../read-only-map';
import {
    TNativeAudioNode,
    TNativeAudioParam,
    TNativeAudioWorkletNode,
    TNativeAudioWorkletNodeFakerFactoryFactory,
    TNativeChannelMergerNode,
    TNativeConstantSourceNode,
    TNativeGainNode
} from '../types';

export const createNativeAudioWorkletNodeFakerFactory: TNativeAudioWorkletNodeFakerFactoryFactory = (
    connectMultipleOutputs,
    createIndexSizeError,
    createInvalidStateError,
    createNativeChannelMergerNode,
    createNativeChannelSplitterNode,
    createNativeConstantSourceNode,
    createNativeGainNode,
    createNativeScriptProcessorNode,
    createNotSupportedError,
    disconnectMultipleOutputs
) => {
    return (nativeContext, baseLatency, processorDefinition, options) => {
        if (options.numberOfInputs === 0 && options.numberOfOutputs === 0) {
            throw createNotSupportedError();
        }

        if (options.outputChannelCount !== undefined) {
            if (options.outputChannelCount.length !== options.numberOfOutputs) {
                throw createIndexSizeError();
            }

            // @todo Check if any of the channelCount values is greater than the implementation's maximum number of channels.
            if (options.outputChannelCount.some((channelCount) => (channelCount < 1))) {
                throw createNotSupportedError();
            }
        }

        // Bug #61: This is not part of the standard but required for the faker to work.
        if (options.channelCountMode !== 'explicit') {
            throw createNotSupportedError();
        }

        const numberOfInputChannels = options.channelCount * options.numberOfInputs;
        const numberOfOutputChannels = options.outputChannelCount.reduce((sum, value) => sum + value, 0);
        const numberOfParameters = (processorDefinition.parameterDescriptors === undefined)
            ? 0
            : processorDefinition.parameterDescriptors.length;

        // Bug #61: This is not part of the standard but required for the faker to work.
        if (numberOfInputChannels + numberOfParameters > 6 || numberOfOutputChannels > 6) {
            throw createNotSupportedError();
        }

        const messageChannel = new MessageChannel();
        const gainNodes: TNativeGainNode[] = [ ];
        const inputChannelSplitterNodes = [ ];

        for (let i = 0; i < options.numberOfInputs; i += 1) {
            gainNodes.push(createNativeGainNode(nativeContext, {
                channelCount: options.channelCount,
                channelCountMode: options.channelCountMode,
                channelInterpretation: options.channelInterpretation,
                gain: 1
            }));
            inputChannelSplitterNodes.push(createNativeChannelSplitterNode(nativeContext, {
                channelCount: options.channelCount,
                channelCountMode: 'explicit',
                channelInterpretation: 'discrete',
                numberOfOutputs: options.channelCount
            }));
        }

        const constantSourceNodes: TNativeConstantSourceNode[] = [ ];

        if (processorDefinition.parameterDescriptors !== undefined) {
            for (const { defaultValue, maxValue, minValue, name } of processorDefinition.parameterDescriptors) {
                const constantSourceNode = createNativeConstantSourceNode(nativeContext, {
                    channelCount: 1,
                    channelCountMode: 'explicit',
                    channelInterpretation: 'discrete',
                    offset: (options.parameterData[name] !== undefined)
                        ? options.parameterData[name]
                        : (defaultValue === undefined)
                            ? 0
                            : defaultValue
                });

                Object.defineProperties(constantSourceNode.offset, {
                    defaultValue: {
                        get: () => (defaultValue === undefined) ? 0 : defaultValue
                    },
                    maxValue: {
                        get: () => (maxValue === undefined) ? MOST_POSITIVE_SINGLE_FLOAT : maxValue
                    },
                    minValue: {
                        get: () => (minValue === undefined) ? MOST_NEGATIVE_SINGLE_FLOAT : minValue
                    }
                });

                constantSourceNodes.push(constantSourceNode);
            }
        }

        const inputChannelMergerNode = createNativeChannelMergerNode(
            nativeContext,
            {
                channelCount: 1,
                channelCountMode: 'explicit',
                channelInterpretation: 'speakers',
                numberOfInputs: Math.max(1, numberOfInputChannels + numberOfParameters)
            }
        );
        const bufferSize = computeBufferSize(baseLatency, nativeContext.sampleRate);
        const scriptProcessorNode = createNativeScriptProcessorNode(
            nativeContext,
            bufferSize,
            numberOfInputChannels + numberOfParameters,
            // Bug #87: Only Firefox will fire an AudioProcessingEvent if there is no connected output.
            Math.max(1, numberOfOutputChannels)
        );
        const outputChannelSplitterNode = createNativeChannelSplitterNode(nativeContext, {
            channelCount: Math.max(1, numberOfOutputChannels),
            channelCountMode: 'explicit',
            channelInterpretation: 'discrete',
            numberOfOutputs: Math.max(1, numberOfOutputChannels)
        });
        const outputChannelMergerNodes: TNativeChannelMergerNode[] = [ ];

        for (let i = 0; i < options.numberOfOutputs; i += 1) {
            outputChannelMergerNodes.push(createNativeChannelMergerNode(
                nativeContext,
                {
                    channelCount: 1,
                    channelCountMode: 'explicit',
                    channelInterpretation: 'speakers',
                    numberOfInputs: options.outputChannelCount[i]
                }
            ));
        }

        for (let i = 0; i < options.numberOfInputs; i += 1) {
            gainNodes[i].connect(inputChannelSplitterNodes[i]);

            for (let j = 0; j < options.channelCount; j += 1) {
                inputChannelSplitterNodes[i].connect(inputChannelMergerNode, j, (i * options.channelCount) + j);
            }
        }

        const parameterMap = new ReadOnlyMap(
            (processorDefinition.parameterDescriptors === undefined)
                ? [ ]
                : processorDefinition.parameterDescriptors
                    .map(({ name }, index) => {
                        const constantSourceNode = constantSourceNodes[index];

                        constantSourceNode.connect(inputChannelMergerNode, 0, numberOfInputChannels + index);
                        constantSourceNode.start(0);

                        return <[ string, TNativeAudioParam ]> [ name, constantSourceNode.offset ];
                    }));

        inputChannelMergerNode.connect(scriptProcessorNode);

        if (options.numberOfOutputs > 0) {
            scriptProcessorNode.connect(outputChannelSplitterNode);
        }

        for (let i = 0, outputChannelSplitterNodeOutput = 0; i < options.numberOfOutputs; i += 1) {
            const outputChannelMergerNode = outputChannelMergerNodes[i];

            for (let j = 0; j < options.outputChannelCount[i]; j += 1) {
                outputChannelSplitterNode.connect(outputChannelMergerNode, outputChannelSplitterNodeOutput + j, j);
            }

            outputChannelSplitterNodeOutput += options.outputChannelCount[i];
        }

        let channelInterpretation = options.channelInterpretation;
        let onprocessorerror: TNativeAudioWorkletNode['onprocessorerror'] = null;

        // Bug #87: Expose at least one output to make this node connectable.
        const outputAudioNodes = (options.numberOfOutputs === 0) ? [ scriptProcessorNode ] : outputChannelMergerNodes;
        const nativeAudioWorkletNodeFaker = {
            get bufferSize (): number {
                return bufferSize;
            },
            get channelCount (): number {
                return options.channelCount;
            },
            set channelCount (_) {
                // Bug #61: This is not part of the standard but required for the faker to work.
                throw createInvalidStateError();
            },
            get channelCountMode (): TNativeAudioWorkletNode['channelCountMode'] {
                return options.channelCountMode;
            },
            set channelCountMode (_) {
                // Bug #61: This is not part of the standard but required for the faker to work.
                throw createInvalidStateError();
            },
            get channelInterpretation (): TNativeAudioWorkletNode['channelInterpretation'] {
                return channelInterpretation;
            },
            set channelInterpretation (value) {
                for (const gainNode of gainNodes) {
                    gainNode.channelInterpretation = value;
                }

                channelInterpretation = value;
            },
            get context (): TNativeAudioWorkletNode['context'] {
                return scriptProcessorNode.context;
            },
            get inputs (): TNativeAudioNode[] {
                return gainNodes;
            },
            get numberOfInputs (): number {
                return options.numberOfInputs;
            },
            get numberOfOutputs (): number {
                return options.numberOfOutputs;
            },
            get onprocessorerror (): TNativeAudioWorkletNode['onprocessorerror'] {
                return onprocessorerror;
            },
            set onprocessorerror (value) {
                if (typeof onprocessorerror === 'function') {
                    nativeAudioWorkletNodeFaker.removeEventListener('processorerror', onprocessorerror);
                }

                onprocessorerror = (typeof value === 'function') ? value : null;

                if (typeof onprocessorerror === 'function') {
                    nativeAudioWorkletNodeFaker.addEventListener('processorerror', onprocessorerror);
                }
            },
            get parameters (): TNativeAudioWorkletNode['parameters'] {
                return parameterMap;
            },
            get port (): TNativeAudioWorkletNode['port'] {
                return messageChannel.port2;
            },
            addEventListener (...args: any[]): void {
                return scriptProcessorNode.addEventListener(args[0], args[1], args[2]);
            },
            connect: <TNativeAudioNode['connect']> connectMultipleOutputs.bind(null, outputAudioNodes),
            disconnect: <TNativeAudioNode['disconnect']> disconnectMultipleOutputs.bind(null, outputAudioNodes),
            dispatchEvent (...args: any[]): boolean {
                return scriptProcessorNode.dispatchEvent(args[0]);
            },
            removeEventListener (...args: any[]): void {
                return scriptProcessorNode.removeEventListener(args[0], args[1], args[2]);
            }
        };

        processorDefinition.prototype.port = messageChannel.port1;

        let audioWorkletProcessor: null | IAudioWorkletProcessor = null;

        const audioWorkletProcessorPromise = createAudioWorkletProcessor(
            nativeContext,
            nativeAudioWorkletNodeFaker,
            processorDefinition,
            options
        );

        audioWorkletProcessorPromise
            .then((dWrkltPrcssr) => audioWorkletProcessor = dWrkltPrcssr);

        const inputs = createNestedArrays(options.numberOfInputs, options.channelCount);
        const outputs = createNestedArrays(options.numberOfOutputs, options.outputChannelCount);
        const parameters: { [ name: string ]: Float32Array } = (processorDefinition.parameterDescriptors === undefined) ?
            [ ] :
            processorDefinition.parameterDescriptors
                .reduce((prmtrs, { name }) => ({ ...prmtrs, [ name ]: new Float32Array(128) }), { });

        let isActive = true;

        scriptProcessorNode.onaudioprocess = ({ inputBuffer, outputBuffer }: AudioProcessingEvent) => { // tslint:disable-line:deprecation
            if (audioWorkletProcessor !== null) {
                for (let i = 0; i < bufferSize; i += 128) {
                    for (let j = 0; j < options.numberOfInputs; j += 1) {
                        for (let k = 0; k < options.channelCount; k += 1) {
                            copyFromChannel(inputBuffer, inputs[j], k, k, i);
                        }
                    }

                    if (processorDefinition.parameterDescriptors !== undefined) {
                        processorDefinition.parameterDescriptors.forEach(({ name }, index) => {
                            copyFromChannel(inputBuffer, parameters, name, numberOfInputChannels + index, i);
                        });
                    }

                    for (let j = 0; j < options.numberOfInputs; j += 1) {
                        for (let k = 0; k < options.outputChannelCount[j]; k += 1) {
                            // The byteLength will be 0 when the ArrayBuffer was transferred.
                            if (outputs[j][k].byteLength === 0) {
                                outputs[j][k] = new Float32Array(128);
                            }
                        }
                    }

                    try {
                        const potentiallyEmptyInputs = inputs
                            .map((input, index) => {
                                const auxiliaryGainNodes = AUXILIARY_GAIN_NODE_STORE.get(nativeAudioWorkletNodeFaker);

                                if (auxiliaryGainNodes === undefined || auxiliaryGainNodes.get(index) === undefined) {
                                    return [ new Float32Array(0) ];
                                }

                                return input;
                            });
                        const activeSourceFlag = audioWorkletProcessor.process(potentiallyEmptyInputs, outputs, parameters);

                        isActive = activeSourceFlag;

                        for (let j = 0, outputChannelSplitterNodeOutput = 0; j < options.numberOfOutputs; j += 1) {
                            for (let k = 0; k < options.outputChannelCount[j]; k += 1) {
                                copyToChannel(outputBuffer, outputs[j], k, outputChannelSplitterNodeOutput + k, i);
                            }

                            outputChannelSplitterNodeOutput += options.outputChannelCount[j];
                        }
                    } catch (error) {
                        isActive = false;

                        nativeAudioWorkletNodeFaker.dispatchEvent(new ErrorEvent('processorerror', { error }));
                    }

                    if (!isActive) {
                        scriptProcessorNode.onaudioprocess = null; // tslint:disable-line:deprecation

                        break;
                    }
                }
            }
        };

        return nativeAudioWorkletNodeFaker;
    };
};
