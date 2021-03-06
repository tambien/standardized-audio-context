import { TNativeAudioBufferSourceNodeFactory } from './native-audio-buffer-source-node-factory';
import { TNativeAudioNodeFactory } from './native-audio-node-factory';
import { TNativeContext } from './native-context';
import {
    TWrapAudioBufferSourceNodeStartMethodOffsetClampingFunction
} from './wrap-audio-buffer-source-node-start-method-offset-clamping-function';
import {
    TWrapAudioScheduledSourceNodeStopMethodConsecutiveCallsFunction
} from './wrap-audio-scheduled-source-node-stop-method-consecutive-calls-function';

export type TNativeAudioBufferSourceNodeFactoryFactory = (
    createNativeAudioNode: TNativeAudioNodeFactory,
    testAudioBufferSourceNodeStartMethodConsecutiveCallsSupport: (nativeContext: TNativeContext) => boolean,
    testAudioBufferSourceNodeStartMethodDurationParameterSupport: () => Promise<boolean>,
    testAudioBufferSourceNodeStartMethodOffsetClampingSupport: (nativeContext: TNativeContext) => boolean,
    testAudioScheduledSourceNodeStartMethodNegativeParametersSupport: (nativeContext: TNativeContext) => boolean,
    testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport: (nativeContext: TNativeContext) => boolean,
    testAudioScheduledSourceNodeStopMethodNegativeParametersSupport: (nativeContext: TNativeContext) => boolean,
    wrapAudioBufferSourceNodeStartMethodOffsetClampling: TWrapAudioBufferSourceNodeStartMethodOffsetClampingFunction,
    wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls: TWrapAudioScheduledSourceNodeStopMethodConsecutiveCallsFunction
) => TNativeAudioBufferSourceNodeFactory;
