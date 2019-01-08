import { assignNativeAudioNodeOptions } from '../helpers/assign-native-audio-node-options';
import { interceptConnections } from '../helpers/intercept-connections';
import { TNativeAudioNode, TNativeWaveShaperNode, TNativeWaveShaperNodeFakerFactoryFactory } from '../types';

export const createNativeWaveShaperNodeFakerFactory: TNativeWaveShaperNodeFakerFactoryFactory = (
    createInvalidStateError,
    createNativeAudioNode,
    createNativeGainNode
) => {
    return (nativeContext, { curve, oversample, ...audioNodeOptions }) => {
        const negativeWaveShaperNode = createNativeAudioNode(nativeContext, (ntvCntxt) => ntvCntxt.createWaveShaper());
        const positiveWaveShaperNode = createNativeAudioNode(nativeContext, (ntvCntxt) => ntvCntxt.createWaveShaper());

        assignNativeAudioNodeOptions(negativeWaveShaperNode, audioNodeOptions);
        assignNativeAudioNodeOptions(positiveWaveShaperNode, audioNodeOptions);

        const inputGainNode = createNativeGainNode(nativeContext, { ...audioNodeOptions, gain: 1 });
        const invertGainNode = createNativeGainNode(nativeContext, { ...audioNodeOptions, gain: -1 });
        const outputGainNode = createNativeGainNode(nativeContext, { ...audioNodeOptions, gain: 1 });
        const revertGainNode = createNativeGainNode(nativeContext, { ...audioNodeOptions, gain: -1 });

        inputGainNode.connect(negativeWaveShaperNode);
        negativeWaveShaperNode.connect(outputGainNode);

        inputGainNode.connect(invertGainNode);
        invertGainNode.connect(positiveWaveShaperNode);
        positiveWaveShaperNode.connect(revertGainNode);
        revertGainNode.connect(outputGainNode);

        let unmodifiedCurve: null | TNativeWaveShaperNode['curve'] = null;

        const nativeWaveShaperNodeFaker = {
            get bufferSize (): undefined {
                return undefined;
            },
            get channelCount (): number {
                return negativeWaveShaperNode.channelCount;
            },
            set channelCount (value) {
                inputGainNode.channelCount = value;
                invertGainNode.channelCount = value;
                negativeWaveShaperNode.channelCount = value;
                outputGainNode.channelCount = value;
                positiveWaveShaperNode.channelCount = value;
                revertGainNode.channelCount = value;
            },
            get channelCountMode (): TNativeWaveShaperNode['channelCountMode'] {
                return negativeWaveShaperNode.channelCountMode;
            },
            set channelCountMode (value) {
                inputGainNode.channelCountMode = value;
                invertGainNode.channelCountMode = value;
                negativeWaveShaperNode.channelCountMode = value;
                outputGainNode.channelCountMode = value;
                positiveWaveShaperNode.channelCountMode = value;
                revertGainNode.channelCountMode = value;
            },
            get channelInterpretation (): TNativeWaveShaperNode['channelInterpretation'] {
                return negativeWaveShaperNode.channelInterpretation;
            },
            set channelInterpretation (value) {
                inputGainNode.channelInterpretation = value;
                invertGainNode.channelInterpretation = value;
                negativeWaveShaperNode.channelInterpretation = value;
                outputGainNode.channelInterpretation = value;
                positiveWaveShaperNode.channelInterpretation = value;
                revertGainNode.channelInterpretation = value;
            },
            get context (): TNativeWaveShaperNode['context'] {
                return negativeWaveShaperNode.context;
            },
            get curve (): TNativeWaveShaperNode['curve'] {
                return unmodifiedCurve;
            },
            set curve (value) {
                // Bug #102: Safari does not throw an InvalidStateError when the curve has less than two samples.
                if (curve !== null && curve.length < 2) {
                    throw createInvalidStateError();
                }

                if (value === null) {
                    negativeWaveShaperNode.curve = value;
                    positiveWaveShaperNode.curve = value;
                } else {
                    const curveLength = value.length;

                    const negativeCurve = new Float32Array(curveLength + 2 - (curveLength % 2));
                    const positiveCurve = new Float32Array(curveLength + 2 - (curveLength % 2));

                    negativeCurve[0] = value[0];
                    positiveCurve[0] = -value[curveLength - 1];

                    const length = Math.ceil((curveLength + 1) / 2);
                    const centerIndex = ((curveLength + 1) / 2) - 1;

                    for (let i = 1; i < length; i += 1) {
                        const theoreticIndex = (i / length) * centerIndex;

                        const lowerIndex = Math.floor(theoreticIndex);
                        const upperIndex = Math.ceil(theoreticIndex);

                        negativeCurve[i] = (lowerIndex === upperIndex)
                            ? value[lowerIndex]
                            : ((1 - (theoreticIndex - lowerIndex)) * value[lowerIndex])
                                + ((1 - (upperIndex - theoreticIndex)) * value[upperIndex]);
                        positiveCurve[i] = (lowerIndex === upperIndex)
                            ? -value[curveLength - 1 - lowerIndex]
                            : -((1 - (theoreticIndex - lowerIndex)) * value[curveLength - 1 - lowerIndex])
                                - ((1 - (upperIndex - theoreticIndex)) * value[curveLength - 1 - upperIndex]);
                    }

                    negativeCurve[length] = (curveLength % 2 === 1) ? value[length - 1] : (value[length - 2] + value[length - 1]) / 2;

                    negativeWaveShaperNode.curve = negativeCurve;
                    positiveWaveShaperNode.curve = positiveCurve;
                }

                unmodifiedCurve = value;
            },
            get inputs (): TNativeAudioNode[] {
                return [ inputGainNode ];
            },
            get numberOfInputs (): number {
                return negativeWaveShaperNode.numberOfInputs;
            },
            get numberOfOutputs (): number {
                return negativeWaveShaperNode.numberOfOutputs;
            },
            get oversample (): TNativeWaveShaperNode['oversample'] {
                return negativeWaveShaperNode.oversample;
            },
            set oversample (value) {
                negativeWaveShaperNode.oversample = value;
                positiveWaveShaperNode.oversample = value;
            },
            addEventListener (...args: any[]): void {
                return inputGainNode.addEventListener(args[0], args[1], args[2]);
            },
            dispatchEvent (...args: any[]): boolean {
                return inputGainNode.dispatchEvent(args[0]);
            },
            removeEventListener (...args: any[]): void {
                return inputGainNode.removeEventListener(args[0], args[1], args[2]);
            }
        };

        if (curve !== nativeWaveShaperNodeFaker.curve) {
            nativeWaveShaperNodeFaker.curve = curve;
        }

        if (oversample !== nativeWaveShaperNodeFaker.oversample) {
            nativeWaveShaperNodeFaker.oversample = oversample;
        }

        return interceptConnections(nativeWaveShaperNodeFaker, outputGainNode);
    };
};
