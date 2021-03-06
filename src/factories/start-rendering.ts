import { cacheTestResult } from '../helpers/cache-test-result';
import { getAudioNodeRenderer } from '../helpers/get-audio-node-renderer';
import { TStartRenderingFactory } from '../types';
import { wrapAudioBufferCopyChannelMethods } from '../wrappers/audio-buffer-copy-channel-methods';
import { wrapAudioBufferCopyChannelMethodsOutOfBounds } from '../wrappers/audio-buffer-copy-channel-methods-out-of-bounds';
import { wrapAudioBufferCopyChannelMethodsSubarray } from '../wrappers/audio-buffer-copy-channel-methods-subarray';
import { wrapAudioBufferGetChannelDataMethod } from '../wrappers/audio-buffer-get-channel-data-method';

export const createStartRendering: TStartRenderingFactory = (
    renderNativeOfflineAudioContext,
    testAudioBufferCopyChannelMethodsOutOfBoundsSupport,
    testAudioBufferCopyChannelMethodsSubarraySupport
) => {
    return (destination, nativeOfflineAudioContext) => getAudioNodeRenderer(destination)
        .render(destination, nativeOfflineAudioContext)
        .then(() => renderNativeOfflineAudioContext(nativeOfflineAudioContext))
        .then((audioBuffer) => {
            // Bug #5: Safari does not support copyFromChannel() and copyToChannel().
            // Bug #100: Safari does throw a wrong error when calling getChannelData() with an out-of-bounds value.
            if (typeof audioBuffer.copyFromChannel !== 'function') {
                wrapAudioBufferCopyChannelMethods(audioBuffer);
                wrapAudioBufferGetChannelDataMethod(audioBuffer);
            // Bug #42: Firefox does not yet fully support copyFromChannel() and copyToChannel().
            } else if (!cacheTestResult(
                testAudioBufferCopyChannelMethodsSubarraySupport,
                () => testAudioBufferCopyChannelMethodsSubarraySupport(audioBuffer)
            )) {
                wrapAudioBufferCopyChannelMethodsSubarray(audioBuffer);
                wrapAudioBufferCopyChannelMethodsOutOfBounds(audioBuffer);
            // Bug #157: No browser does allow the bufferOffset to be out-of-bounds.
            } else if (!cacheTestResult(
                testAudioBufferCopyChannelMethodsOutOfBoundsSupport,
                () => testAudioBufferCopyChannelMethodsOutOfBoundsSupport(audioBuffer)
            )) {
                wrapAudioBufferCopyChannelMethodsOutOfBounds(audioBuffer);
            }

            return audioBuffer;
        });
};
