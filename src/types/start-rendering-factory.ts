import { TNativeAudioBuffer } from './native-audio-buffer';
import { TRenderNativeOfflineAudioContextFunction } from './render-native-offline-audio-context-function';
import { TStartRenderingFunction } from './start-rendering-function';

export type TStartRenderingFactory = (
    renderNativeOfflineAudioContext: TRenderNativeOfflineAudioContextFunction,
    testAudioBufferCopyChannelMethodsOutOfBoundsSupport: (nativeAudioBuffer: TNativeAudioBuffer) => boolean,
    testAudioBufferCopyChannelMethodsSubarraySupport: (nativeAudioBuffer: TNativeAudioBuffer) => boolean
) => TStartRenderingFunction;
