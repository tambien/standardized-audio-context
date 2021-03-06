import '../../helper/play-silence';
import { AudioBuffer, AudioBufferSourceNode, AudioWorkletNode, GainNode, addAudioWorkletModule } from '../../../src/module';
import { BACKUP_NATIVE_CONTEXT_STORE } from '../../../src/globals';
import { createAudioContext } from '../../helper/create-audio-context';
import { createMinimalAudioContext } from '../../helper/create-minimal-audio-context';
import { createMinimalOfflineAudioContext } from '../../helper/create-minimal-offline-audio-context';
import { createOfflineAudioContext } from '../../helper/create-offline-audio-context';
import { createRenderer } from '../../helper/create-renderer';

const createGainNodeWithConstructor = (context, options = null) => {
    if (options === null) {
        return new GainNode(context);
    }

    return new GainNode(context, options);
};
const createGainNodeWithFactoryFunction = (context, options = null) => {
    const gainNode = context.createGain();

    if (options !== null && options.channelCount !== undefined) {
        gainNode.channelCount = options.channelCount;
    }

    if (options !== null && options.channelCountMode !== undefined) {
        gainNode.channelCountMode = options.channelCountMode;
    }

    if (options !== null && options.channelInterpretation !== undefined) {
        gainNode.channelInterpretation = options.channelInterpretation;
    }

    if (options !== null && options.gain !== undefined) {
        gainNode.gain.value = options.gain;
    }

    return gainNode;
};
const testCases = {
    'constructor of a MinimalAudioContext': {
        createContext: createMinimalAudioContext,
        createGainNode: createGainNodeWithConstructor
    },
    'constructor of a MinimalOfflineAudioContext': {
        createContext: createMinimalOfflineAudioContext,
        createGainNode: createGainNodeWithConstructor
    },
    'constructor of an AudioContext': {
        createContext: createAudioContext,
        createGainNode: createGainNodeWithConstructor
    },
    'constructor of an OfflineAudioContext': {
        createContext: createOfflineAudioContext,
        createGainNode: createGainNodeWithConstructor
    },
    'factory function of an AudioContext': {
        createContext: createAudioContext,
        createGainNode: createGainNodeWithFactoryFunction
    },
    'factory function of an OfflineAudioContext': {
        createContext: createOfflineAudioContext,
        createGainNode: createGainNodeWithFactoryFunction
    }
};

describe('GainNode', () => {

    for (const [ description, { createGainNode, createContext } ] of Object.entries(testCases)) {

        describe(`with the ${ description }`, () => {

            let context;

            afterEach(() => {
                if (context.close !== undefined) {
                    return context.close();
                }
            });

            beforeEach(() => context = createContext());

            describe('constructor()', () => {

                for (const audioContextState of [ 'closed', 'running' ]) {

                    describe(`with an audioContextState of "${ audioContextState }"`, () => {

                        afterEach(() => {
                            if (audioContextState === 'closed') {
                                const backupNativeContext = BACKUP_NATIVE_CONTEXT_STORE.get(context._nativeContext);

                                // Bug #94: Edge also exposes a close() method on an OfflineAudioContext which is why this check is necessary.
                                if (backupNativeContext !== undefined && backupNativeContext.startRendering === undefined) {
                                    context = backupNativeContext;
                                } else {
                                    context.close = undefined;
                                }
                            }
                        });

                        beforeEach(() => {
                            if (audioContextState === 'closed') {
                                if (context.close === undefined) {
                                    return context.startRendering();
                                }

                                return context.close();
                            }
                        });

                        describe('without any options', () => {

                            let gainNode;

                            beforeEach(() => {
                                gainNode = createGainNode(context);
                            });

                            it('should return an instance of the EventTarget interface', () => {
                                expect(gainNode.addEventListener).to.be.a('function');
                                expect(gainNode.dispatchEvent).to.be.a('function');
                                expect(gainNode.removeEventListener).to.be.a('function');
                            });

                            it('should return an instance of the AudioNode interface', () => {
                                expect(gainNode.channelCount).to.equal(2);
                                expect(gainNode.channelCountMode).to.equal('max');
                                expect(gainNode.channelInterpretation).to.equal('speakers');
                                expect(gainNode.connect).to.be.a('function');
                                expect(gainNode.context).to.be.an.instanceOf(context.constructor);
                                expect(gainNode.disconnect).to.be.a('function');
                                expect(gainNode.numberOfInputs).to.equal(1);
                                expect(gainNode.numberOfOutputs).to.equal(1);
                            });

                            it('should return an instance of the GainNode interface', () => {
                                expect(gainNode.gain).not.to.be.undefined;
                            });

                        });

                        describe('with valid options', () => {

                            it('should return an instance with the given channelCount', () => {
                                const channelCount = 4;
                                const gainNode = createGainNode(context, { channelCount });

                                expect(gainNode.channelCount).to.equal(channelCount);
                            });

                            it('should return an instance with the given channelCountMode', () => {
                                const channelCountMode = 'explicit';
                                const gainNode = createGainNode(context, { channelCountMode });

                                expect(gainNode.channelCountMode).to.equal(channelCountMode);
                            });

                            it('should return an instance with the given channelInterpretation', () => {
                                const channelInterpretation = 'discrete';
                                const gainNode = createGainNode(context, { channelInterpretation });

                                expect(gainNode.channelInterpretation).to.equal(channelInterpretation);
                            });

                            it('should return an instance with the given initial value for gain', () => {
                                const gain = 0.5;
                                const gainNode = createGainNode(context, { gain });

                                expect(gainNode.gain.value).to.equal(gain);
                            });

                        });

                    });

                }

            });

            describe('channelCount', () => {

                let gainNode;

                beforeEach(() => {
                    gainNode = createGainNode(context);
                });

                it('should be assignable to another value', () => {
                    const channelCount = 4;

                    gainNode.channelCount = channelCount;

                    expect(gainNode.channelCount).to.equal(channelCount);
                });

            });

            describe('channelCountMode', () => {

                let gainNode;

                beforeEach(() => {
                    gainNode = createGainNode(context);
                });

                it('should be assignable to another value', () => {
                    const channelCountMode = 'explicit';

                    gainNode.channelCountMode = channelCountMode;

                    expect(gainNode.channelCountMode).to.equal(channelCountMode);
                });

            });

            describe('channelInterpretation', () => {

                let gainNode;

                beforeEach(() => {
                    gainNode = createGainNode(context);
                });

                it('should be assignable to another value', () => {
                    const channelInterpretation = 'discrete';

                    gainNode.channelInterpretation = channelInterpretation;

                    expect(gainNode.channelInterpretation).to.equal(channelInterpretation);
                });

            });

            describe('gain', () => {

                it('should return an instance of the AudioParam interface', () => {
                    const gainNode = createGainNode(context);

                    expect(gainNode.gain.cancelScheduledValues).to.be.a('function');
                    expect(gainNode.gain.defaultValue).to.equal(1);
                    expect(gainNode.gain.exponentialRampToValueAtTime).to.be.a('function');
                    expect(gainNode.gain.linearRampToValueAtTime).to.be.a('function');
                    expect(gainNode.gain.maxValue).to.equal(3.4028234663852886e38);
                    expect(gainNode.gain.minValue).to.equal(-3.4028234663852886e38);
                    expect(gainNode.gain.setTargetAtTime).to.be.a('function');
                    expect(gainNode.gain.setValueAtTime).to.be.a('function');
                    expect(gainNode.gain.setValueCurveAtTime).to.be.a('function');
                    expect(gainNode.gain.value).to.equal(1);
                });

                it('should be readonly', () => {
                    const gainNode = createGainNode(context);

                    expect(() => {
                        gainNode.gain = 'anything';
                    }).to.throw(TypeError);
                });

                describe('cancelScheduledValues()', () => {

                    let gainNode;

                    beforeEach(() => {
                        gainNode = createGainNode(context);
                    });

                    it('should be chainable', () => {
                        expect(gainNode.gain.cancelScheduledValues(0)).to.equal(gainNode.gain);
                    });

                });

                describe('exponentialRampToValueAtTime()', () => {

                    let gainNode;

                    beforeEach(() => {
                        gainNode = createGainNode(context);
                    });

                    it('should be chainable', () => {
                        expect(gainNode.gain.exponentialRampToValueAtTime(1, 0)).to.equal(gainNode.gain);
                    });

                });

                describe('linearRampToValueAtTime()', () => {

                    let gainNode;

                    beforeEach(() => {
                        gainNode = createGainNode(context);
                    });

                    it('should be chainable', () => {
                        expect(gainNode.gain.linearRampToValueAtTime(1, 0)).to.equal(gainNode.gain);
                    });

                });

                describe('setTargetAtTime()', () => {

                    let gainNode;

                    beforeEach(() => {
                        gainNode = createGainNode(context);
                    });

                    it('should be chainable', () => {
                        expect(gainNode.gain.setTargetAtTime(1, 0, 0.1)).to.equal(gainNode.gain);
                    });

                });

                describe('setValueAtTime()', () => {

                    let gainNode;

                    beforeEach(() => {
                        gainNode = createGainNode(context);
                    });

                    it('should be chainable', () => {
                        expect(gainNode.gain.setValueAtTime(1, 0)).to.equal(gainNode.gain);
                    });

                });

                describe('setValueCurveAtTime()', () => {

                    let gainNode;

                    beforeEach(() => {
                        gainNode = createGainNode(context);
                    });

                    it('should be chainable', () => {
                        expect(gainNode.gain.setValueAtTime(new Float32Array([ 1 ]), 0, 0)).to.equal(gainNode.gain);
                    });

                });

                describe('automation', () => {

                    for (const withAnAppendedAudioWorklet of (description.includes('Offline') ? [ true, false ] : [ false ])) {

                        describe(`${ withAnAppendedAudioWorklet ? 'with' : 'without' } an appended AudioWorklet`, () => {

                            let renderer;
                            let values;

                            beforeEach(async function () {
                                this.timeout(10000);

                                values = [ 1, 0.5, 0, -0.5, -1 ];

                                if (withAnAppendedAudioWorklet) {
                                    await addAudioWorkletModule(context, 'base/test/fixtures/gain-processor.js');
                                }

                                renderer = createRenderer({
                                    context,
                                    length: (context.length === undefined) ? 5 : undefined,
                                    prepare (destination) {
                                        const audioBuffer = new AudioBuffer({ length: 5, sampleRate: context.sampleRate });
                                        const audioBufferSourceNode = new AudioBufferSourceNode(context);
                                        const audioWorkletNode = (withAnAppendedAudioWorklet) ? new AudioWorkletNode(context, 'gain-processor') : null;
                                        const gainNode = createGainNode(context);

                                        audioBuffer.copyToChannel(new Float32Array(values), 0);

                                        audioBufferSourceNode.buffer = audioBuffer;

                                        if (withAnAppendedAudioWorklet) {
                                            audioBufferSourceNode
                                                .connect(gainNode)
                                                .connect(audioWorkletNode)
                                                .connect(destination);
                                        } else {
                                            audioBufferSourceNode
                                                .connect(gainNode)
                                                .connect(destination);
                                        }

                                        return { audioBufferSourceNode, gainNode };
                                    }
                                });
                            });

                            describe('without any automation', () => {

                                it('should not modify the signal', function () {
                                    this.timeout(10000);

                                    return renderer({
                                        start (startTime, { audioBufferSourceNode }) {
                                            audioBufferSourceNode.start(startTime);
                                        }
                                    })
                                        .then((channelData) => {
                                            expect(Array.from(channelData)).to.deep.equal(values);
                                        });
                                });

                            });

                            describe('with a modified value', () => {

                                it('should modify the signal', function () {
                                    this.timeout(10000);

                                    return renderer({
                                        prepare ({ gainNode }) {
                                            gainNode.gain.value = 0.5;
                                        },
                                        start (startTime, { audioBufferSourceNode }) {
                                            audioBufferSourceNode.start(startTime);
                                        }
                                    })
                                        .then((channelData) => {
                                            expect(Array.from(channelData)).to.deep.equal([ 0.5, 0.25, 0, -0.25, -0.5 ]);
                                        });
                                });

                            });

                            describe('with a call to cancelScheduledValues()', () => {

                                it('should modify the signal', function () {
                                    this.timeout(10000);

                                    return renderer({
                                        start (startTime, { audioBufferSourceNode, gainNode }) {
                                            gainNode.gain.setValueAtTime(0.5, (startTime === 0) ? startTime : startTime - (0.1 / context.sampleRate));
                                            gainNode.gain.setValueAtTime(1, startTime + (1.9 / context.sampleRate));
                                            gainNode.gain.linearRampToValueAtTime(0, startTime + (5 / context.sampleRate));
                                            gainNode.gain.cancelScheduledValues(startTime + (3 / context.sampleRate));

                                            audioBufferSourceNode.start(startTime);
                                        }
                                    })
                                        .then((channelData) => {
                                            expect(Array.from(channelData)).to.deep.equal([ 0.5, 0.25, 0, -0.5, -1 ]);
                                        });
                                });

                            });

                            describe('with a call to setValueAtTime()', () => {

                                it('should modify the signal', function () {
                                    this.timeout(10000);

                                    return renderer({
                                        start (startTime, { audioBufferSourceNode, gainNode }) {
                                            gainNode.gain.setValueAtTime(0.5, startTime + (1.9 / context.sampleRate));

                                            audioBufferSourceNode.start(startTime);
                                        }
                                    })
                                        .then((channelData) => {
                                            expect(Array.from(channelData)).to.deep.equal([ 1, 0.5, 0, -0.25, -0.5 ]);
                                        });
                                });

                            });

                            describe('with a call to setValueCurveAtTime()', () => {

                                it('should modify the signal', function () {
                                    this.timeout(10000);

                                    return renderer({
                                        start (startTime, { audioBufferSourceNode, gainNode }) {
                                            gainNode.gain.setValueCurveAtTime(new Float32Array([ 0, 0.25, 0.5, 0.75, 1 ]), (startTime === 0) ? startTime : startTime - (1e-12 / context.sampleRate), (6 / context.sampleRate));

                                            audioBufferSourceNode.start(startTime);
                                        }
                                    })
                                        .then((channelData) => {
                                            expect(Array.from(channelData)).to.deep.equal([ 0, 0.0833333358168602, 0, -0.25, -0.6666666865348816 ]);
                                        });
                                });

                            });

                            describe('with another AudioNode connected to the AudioParam', () => {

                                it('should modify the signal', function () {
                                    this.timeout(10000);

                                    return renderer({
                                        prepare ({ gainNode }) {
                                            const audioBuffer = new AudioBuffer({ length: 5, sampleRate: context.sampleRate });
                                            const audioBufferSourceNodeForAudioParam = new AudioBufferSourceNode(context);

                                            audioBuffer.copyToChannel(new Float32Array([ 0.5, 0.5, 0.5, 0.5, 0.5 ]), 0);

                                            audioBufferSourceNodeForAudioParam.buffer = audioBuffer;

                                            gainNode.gain.value = 0;

                                            audioBufferSourceNodeForAudioParam.connect(gainNode.gain);

                                            return { audioBufferSourceNodeForAudioParam };
                                        },
                                        start (startTime, { audioBufferSourceNode, audioBufferSourceNodeForAudioParam }) {
                                            audioBufferSourceNode.start(startTime);
                                            audioBufferSourceNodeForAudioParam.start(startTime);
                                        }
                                    })
                                        .then((channelData) => {
                                            expect(Array.from(channelData)).to.deep.equal([ 0.5, 0.25, 0, -0.25, -0.5 ]);
                                        });
                                });

                            });

                            // @todo Test other automations as well.

                        });

                    }

                });

            });

            describe('connect()', () => {

                let gainNode;

                beforeEach(() => {
                    gainNode = createGainNode(context);
                });

                for (const type of [ 'AudioNode', 'AudioParam' ]) {

                    describe(`with an ${ type }`, () => {

                        let audioNodeOrAudioParam;

                        beforeEach(() => {
                            const anotherGainNode = createGainNode(context);

                            audioNodeOrAudioParam = (type === 'AudioNode') ? anotherGainNode : anotherGainNode.gain;
                        });

                        if (type === 'AudioNode') {

                            it('should be chainable', () => {
                                expect(gainNode.connect(audioNodeOrAudioParam)).to.equal(audioNodeOrAudioParam);
                            });

                        } else {

                            it('should not be chainable', () => {
                                expect(gainNode.connect(audioNodeOrAudioParam)).to.be.undefined;
                            });

                        }

                        it('should accept duplicate connections', () => {
                            gainNode.connect(audioNodeOrAudioParam);
                            gainNode.connect(audioNodeOrAudioParam);
                        });

                        it('should throw an IndexSizeError if the output is out-of-bound', (done) => {
                            try {
                                gainNode.connect(audioNodeOrAudioParam, -1);
                            } catch (err) {
                                expect(err.code).to.equal(1);
                                expect(err.name).to.equal('IndexSizeError');

                                done();
                            }
                        });

                        if (type === 'AudioNode') {

                            it('should throw an IndexSizeError if the input is out-of-bound', (done) => {
                                try {
                                    gainNode.connect(audioNodeOrAudioParam, 0, -1);
                                } catch (err) {
                                    expect(err.code).to.equal(1);
                                    expect(err.name).to.equal('IndexSizeError');

                                    done();
                                }
                            });

                            it('should throw a NotSupportedError if the connection creates a cycle by connecting to the source', (done) => {
                                try {
                                    audioNodeOrAudioParam
                                        .connect(gainNode)
                                        .connect(audioNodeOrAudioParam);
                                } catch (err) {
                                    expect(err.code).to.equal(9);
                                    expect(err.name).to.equal('NotSupportedError');

                                    done();
                                }
                            });

                            it('should throw a NotSupportedError if the connection creates a cycle by connecting to an AudioParam of the source', (done) => {
                                try {
                                    audioNodeOrAudioParam
                                        .connect(gainNode)
                                        .connect(audioNodeOrAudioParam.gain);
                                } catch (err) {
                                    expect(err.code).to.equal(9);
                                    expect(err.name).to.equal('NotSupportedError');

                                    done();
                                }
                            });

                        }

                    });

                    describe(`with an ${ type } of another context`, () => {

                        let anotherContext;
                        let audioNodeOrAudioParam;

                        afterEach(() => {
                            if (anotherContext.close !== undefined) {
                                return anotherContext.close();
                            }
                        });

                        beforeEach(() => {
                            anotherContext = createContext();

                            const anotherGainNode = createGainNode(anotherContext);

                            audioNodeOrAudioParam = (type === 'AudioNode') ? anotherGainNode : anotherGainNode.gain;
                        });

                        it('should throw an InvalidAccessError', (done) => {
                            try {
                                gainNode.connect(audioNodeOrAudioParam);
                            } catch (err) {
                                expect(err.code).to.equal(15);
                                expect(err.name).to.equal('InvalidAccessError');

                                done();
                            }
                        });

                    });

                }

            });

            describe('disconnect()', () => {

                let createPredefinedRenderer;

                beforeEach(() => {
                    createPredefinedRenderer = (values) => createRenderer({
                        context,
                        length: (context.length === undefined) ? 5 : undefined,
                        prepare (destination) {
                            const audioBuffer = new AudioBuffer({ length: 5, sampleRate: context.sampleRate });
                            const audioBufferSourceNode = new AudioBufferSourceNode(context);
                            const firstDummyGainNode = new GainNode(context);
                            const gainNode = createGainNode(context);
                            const secondDummyGainNode = new GainNode(context);

                            audioBuffer.copyToChannel(new Float32Array(values), 0);

                            audioBufferSourceNode.buffer = audioBuffer;

                            audioBufferSourceNode
                                .connect(gainNode)
                                .connect(firstDummyGainNode)
                                .connect(destination);

                            gainNode.connect(secondDummyGainNode);

                            return { audioBufferSourceNode, firstDummyGainNode, gainNode, secondDummyGainNode };
                        }
                    });
                });

                describe('without any parameters', () => {

                    let renderer;
                    let values;

                    beforeEach(function () {
                        this.timeout(10000);

                        values = [ 1, 1, 1, 1, 1 ];

                        renderer = createPredefinedRenderer(values);
                    });

                    it('should disconnect all destinations', function () {
                        this.timeout(10000);

                        return renderer({
                            prepare ({ gainNode }) {
                                gainNode.disconnect();
                            },
                            start (startTime, { audioBufferSourceNode }) {
                                audioBufferSourceNode.start(startTime);
                            }
                        })
                            .then((channelData) => {
                                expect(Array.from(channelData)).to.deep.equal([ 0, 0, 0, 0, 0 ]);
                            });
                    });

                });

                describe('with an output', () => {

                    describe('with a value which is out-of-bound', () => {

                        let gainNode;

                        beforeEach(() => {
                            gainNode = createGainNode(context);
                        });

                        it('should throw an IndexSizeError', (done) => {
                            try {
                                gainNode.disconnect(-1);
                            } catch (err) {
                                expect(err.code).to.equal(1);
                                expect(err.name).to.equal('IndexSizeError');

                                done();
                            }
                        });

                    });

                    describe('with a connection from the given output', () => {

                        let renderer;
                        let values;

                        beforeEach(function () {
                            this.timeout(10000);

                            values = [ 1, 1, 1, 1, 1 ];

                            renderer = createPredefinedRenderer(values);
                        });

                        it('should disconnect all destinations from the given output', function () {
                            this.timeout(10000);

                            return renderer({
                                prepare ({ gainNode }) {
                                    gainNode.disconnect(0);
                                },
                                start (startTime, { audioBufferSourceNode }) {
                                    audioBufferSourceNode.start(startTime);
                                }
                            })
                                .then((channelData) => {
                                    expect(Array.from(channelData)).to.deep.equal([ 0, 0, 0, 0, 0 ]);
                                });
                        });

                    });

                });

                describe('with a destination', () => {

                    describe('without a connection to the given destination', () => {

                        let gainNode;

                        beforeEach(() => {
                            gainNode = createGainNode(context);
                        });

                        it('should throw an InvalidAccessError', (done) => {
                            try {
                                gainNode.disconnect(new GainNode(context));
                            } catch (err) {
                                expect(err.code).to.equal(15);
                                expect(err.name).to.equal('InvalidAccessError');

                                done();
                            }
                        });

                    });

                    describe('with a connection to the given destination', () => {

                        let renderer;
                        let values;

                        beforeEach(function () {
                            this.timeout(10000);

                            values = [ 1, 1, 1, 1, 1 ];

                            renderer = createPredefinedRenderer(values);
                        });

                        it('should disconnect the destination', function () {
                            this.timeout(10000);

                            return renderer({
                                prepare ({ firstDummyGainNode, gainNode }) {
                                    gainNode.disconnect(firstDummyGainNode);
                                },
                                start (startTime, { audioBufferSourceNode }) {
                                    audioBufferSourceNode.start(startTime);
                                }
                            })
                                .then((channelData) => {
                                    expect(Array.from(channelData)).to.deep.equal([ 0, 0, 0, 0, 0 ]);
                                });
                        });

                        it('should disconnect another destination in isolation', function () {
                            this.timeout(10000);

                            return renderer({
                                prepare ({ gainNode, secondDummyGainNode }) {
                                    gainNode.disconnect(secondDummyGainNode);
                                },
                                start (startTime, { audioBufferSourceNode }) {
                                    audioBufferSourceNode.start(startTime);
                                }
                            })
                                .then((channelData) => {
                                    expect(Array.from(channelData)).to.deep.equal(values);
                                });
                        });

                    });

                });

                describe('with a destination and an output', () => {

                    let gainNode;

                    beforeEach(() => {
                        gainNode = createGainNode(context);
                    });

                    it('should throw an IndexSizeError if the output is out-of-bound', (done) => {
                        try {
                            gainNode.disconnect(new GainNode(context), -1);
                        } catch (err) {
                            expect(err.code).to.equal(1);
                            expect(err.name).to.equal('IndexSizeError');

                            done();
                        }
                    });

                    it('should throw an InvalidAccessError if there is no similar connection', (done) => {
                        try {
                            gainNode.disconnect(new GainNode(context), 0);
                        } catch (err) {
                            expect(err.code).to.equal(15);
                            expect(err.name).to.equal('InvalidAccessError');

                            done();
                        }
                    });

                });

                describe('with a destination, an output and an input', () => {

                    let gainNode;

                    beforeEach(() => {
                        gainNode = createGainNode(context);
                    });

                    it('should throw an IndexSizeError if the output is out-of-bound', (done) => {
                        try {
                            gainNode.disconnect(new GainNode(context), -1, 0);
                        } catch (err) {
                            expect(err.code).to.equal(1);
                            expect(err.name).to.equal('IndexSizeError');

                            done();
                        }
                    });

                    it('should throw an IndexSizeError if the input is out-of-bound', (done) => {
                        try {
                            gainNode.disconnect(new GainNode(context), 0, -1);
                        } catch (err) {
                            expect(err.code).to.equal(1);
                            expect(err.name).to.equal('IndexSizeError');

                            done();
                        }
                    });

                    it('should throw an InvalidAccessError if there is no similar connection', (done) => {
                        try {
                            gainNode.disconnect(new GainNode(context), 0, 0);
                        } catch (err) {
                            expect(err.code).to.equal(15);
                            expect(err.name).to.equal('InvalidAccessError');

                            done();
                        }
                    });

                });

            });

        });

    }

});
