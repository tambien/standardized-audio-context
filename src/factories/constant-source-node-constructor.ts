import { MOST_NEGATIVE_SINGLE_FLOAT, MOST_POSITIVE_SINGLE_FLOAT } from '../constants';
import { getNativeContext } from '../helpers/get-native-context';
import { setInternalState } from '../helpers/set-internal-state';
import { wrapEventListener } from '../helpers/wrap-event-listener';
import {
    IAudioParam,
    IConstantSourceNode,
    IConstantSourceNodeRenderer,
    IConstantSourceOptions,
    IEndedEventHandler,
    IMinimalBaseAudioContext,
    IMinimalOfflineAudioContext
} from '../interfaces';
import { TConstantSourceNodeConstructorFactory, TConstantSourceNodeRenderer, TNativeConstantSourceNode } from '../types';

const DEFAULT_OPTIONS: IConstantSourceOptions = {
    channelCount: 2,
    channelCountMode: 'max',
    channelInterpretation: 'speakers',
    offset: 1
};

export const createConstantSourceNodeConstructor: TConstantSourceNodeConstructorFactory = (
    createAudioParam,
    createConstantSourceNodeRendererFactory,
    createNativeConstantSourceNode,
    isNativeOfflineAudioContext,
    noneAudioDestinationNodeConstructor
) => {

    return class ConstantSourceNode<T extends IMinimalBaseAudioContext>
            extends noneAudioDestinationNodeConstructor<T>
            implements IConstantSourceNode<T> {

        private _constantSourceNodeRenderer: null | IConstantSourceNodeRenderer<IMinimalOfflineAudioContext>;

        private _nativeConstantSourceNode: TNativeConstantSourceNode;

        private _offset: IAudioParam;

        private _onended: null | IEndedEventHandler<T, this>;

        constructor (context: T, options: Partial<IConstantSourceOptions> = DEFAULT_OPTIONS) {
            const nativeContext = getNativeContext(context);
            const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
            const nativeConstantSourceNode = createNativeConstantSourceNode(nativeContext, mergedOptions);
            const isOffline = isNativeOfflineAudioContext(nativeContext);
            const constantSourceNodeRenderer = <TConstantSourceNodeRenderer<T>> ((isOffline)
                ? createConstantSourceNodeRendererFactory()
                : null);

            super(context, 'passive', nativeConstantSourceNode, constantSourceNodeRenderer);

            this._constantSourceNodeRenderer = constantSourceNodeRenderer;
            this._nativeConstantSourceNode = nativeConstantSourceNode;
            /*
             * Bug #62 & #74: Edge & Safari do not support ConstantSourceNodes and do not export the correct values for maxValue and
             * minValue for GainNodes.
             */
            this._offset = createAudioParam(
                this,
                isOffline,
                nativeConstantSourceNode.offset,
                MOST_POSITIVE_SINGLE_FLOAT,
                MOST_NEGATIVE_SINGLE_FLOAT
            );
            this._onended = null;
        }

        get offset (): IAudioParam {
            return this._offset;
        }

        get onended (): null | IEndedEventHandler<T, this> {
            return this._onended;
        }

        set onended (value) {
            const wrappedListener = <TNativeConstantSourceNode['onended']> wrapEventListener(this, value);

            this._nativeConstantSourceNode.onended = wrappedListener;

            const nativeOnEnded = <null | IEndedEventHandler<T, this>> this._nativeConstantSourceNode.onended;

            this._onended = (nativeOnEnded === wrappedListener) ? value : nativeOnEnded;
        }

        public start (when = 0): void {
            this._nativeConstantSourceNode.start(when);

            if (this._constantSourceNodeRenderer !== null) {
                this._constantSourceNodeRenderer.start = when;
            } else {
                setInternalState(this, 'active');

                const setInternalStateToInactive = () => {
                    this._nativeConstantSourceNode.removeEventListener('ended', setInternalStateToInactive);

                    // @todo Determine a meaningful delay instead of just using one second.
                    setTimeout(() => setInternalState(this, 'passive'), 1000);
                };

                this._nativeConstantSourceNode.addEventListener('ended', setInternalStateToInactive);
            }
        }

        public stop (when = 0): void {
            this._nativeConstantSourceNode.stop(when);

            if (this._constantSourceNodeRenderer !== null) {
                this._constantSourceNodeRenderer.stop = when;
            }
        }

    };

};
