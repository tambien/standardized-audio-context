import { getNativeAudioNode } from '../helpers/get-native-audio-node';
import { isOwnedByContext } from '../helpers/is-owned-by-context';
import { renderInputsOfAudioNode } from '../helpers/render-inputs-of-audio-node';
import { IAudioNode, IChannelSplitterOptions, IMinimalOfflineAudioContext } from '../interfaces';
import { TChannelSplitterNodeRendererFactoryFactory, TNativeAudioNode, TNativeOfflineAudioContext } from '../types';

export const createChannelSplitterNodeRendererFactory: TChannelSplitterNodeRendererFactoryFactory = (createNativeChannelSplitterNode) => {
    return <T extends IMinimalOfflineAudioContext>() => {
        let nativeAudioNodePromise: null | Promise<TNativeAudioNode> = null;

        const createAudioNode = async (proxy: IAudioNode<T>, nativeOfflineAudioContext: TNativeOfflineAudioContext) => {
            let nativeAudioNode = getNativeAudioNode<T, TNativeAudioNode>(proxy);

            // If the initially used nativeAudioNode was not constructed on the same OfflineAudioContext it needs to be created again.
            if (!isOwnedByContext(nativeAudioNode, nativeOfflineAudioContext)) {
                const options: IChannelSplitterOptions = {
                    channelCount: nativeAudioNode.channelCount,
                    channelCountMode: nativeAudioNode.channelCountMode,
                    channelInterpretation: nativeAudioNode.channelInterpretation,
                    numberOfOutputs: nativeAudioNode.numberOfOutputs
                };

                nativeAudioNode = createNativeChannelSplitterNode(nativeOfflineAudioContext, options);
            }

            await renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeAudioNode);

            return nativeAudioNode;
        };

        return {
            render (proxy: IAudioNode<T>, nativeOfflineAudioContext: TNativeOfflineAudioContext): Promise<TNativeAudioNode> {
                if (nativeAudioNodePromise === null) {
                    nativeAudioNodePromise = createAudioNode(proxy, nativeOfflineAudioContext);
                }

                return nativeAudioNodePromise;
            }
        };
    };
};
