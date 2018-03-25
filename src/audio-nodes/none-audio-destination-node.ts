import { Injector } from '@angular/core';
import { INVALID_STATE_ERROR_FACTORY_PROVIDER, InvalidStateErrorFactory } from '../factories/invalid-state-error';
import { IMinimalBaseAudioContext } from '../interfaces';
import { TNativeAudioNode } from '../types';
import { AudioNode } from './audio-node';

const injector = Injector.create({
    providers: [
        INVALID_STATE_ERROR_FACTORY_PROVIDER
    ]
});

const invalidStateErrorFactory = injector.get(InvalidStateErrorFactory);

export class NoneAudioDestinationNode<T extends TNativeAudioNode> extends AudioNode<T> {

    constructor (context: IMinimalBaseAudioContext, nativeNode: T, channelCount: number) {
        // Bug #50 Safari does not throw an error when the context is already closed.
        if (context.state === 'closed') {
            throw invalidStateErrorFactory.create();
        }

        super(context, nativeNode, channelCount);
    }

}
