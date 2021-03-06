import { getNativeAudioNode } from '../helpers/get-native-audio-node';
import { isOwnedByContext } from '../helpers/is-owned-by-context';
import { renderInputsOfAudioNode } from '../helpers/render-inputs-of-audio-node';
import { IConvolverNode, IConvolverOptions, IMinimalOfflineAudioContext } from '../interfaces';
import { TConvolverNodeRendererFactoryFactory, TNativeConvolverNode, TNativeOfflineAudioContext } from '../types';

export const createConvolverNodeRendererFactory: TConvolverNodeRendererFactoryFactory = (createNativeConvolverNode) => {
    return <T extends IMinimalOfflineAudioContext>() => {
        let nativeConvolverNodePromise: null | Promise<TNativeConvolverNode> = null;

        const createConvolverNode = async (proxy: IConvolverNode<T>, nativeOfflineAudioContext: TNativeOfflineAudioContext) => {
            let nativeConvolverNode = getNativeAudioNode<T, TNativeConvolverNode>(proxy);

            // If the initially used nativeConvolverNode was not constructed on the same OfflineAudioContext it needs to be created again.
            if (!isOwnedByContext(nativeConvolverNode, nativeOfflineAudioContext)) {
                const options: IConvolverOptions = {
                    buffer: nativeConvolverNode.buffer,
                    channelCount: nativeConvolverNode.channelCount,
                    channelCountMode: nativeConvolverNode.channelCountMode,
                    channelInterpretation: nativeConvolverNode.channelInterpretation,
                    disableNormalization: !nativeConvolverNode.normalize
                };

                nativeConvolverNode = createNativeConvolverNode(nativeOfflineAudioContext, options);
            }

            await renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeConvolverNode);

            return nativeConvolverNode;
        };

        return {
            render (proxy: IConvolverNode<T>, nativeOfflineAudioContext: TNativeOfflineAudioContext): Promise<TNativeConvolverNode> {
                if (nativeConvolverNodePromise === null) {
                    nativeConvolverNodePromise = createConvolverNode(proxy, nativeOfflineAudioContext);
                }

                return nativeConvolverNodePromise;
            }
        };
    };
};
