import { Injector } from '@angular/core';
import { INVALID_STATE_ERROR_FACTORY_PROVIDER, InvalidStateErrorFactory } from '../factories/invalid-state-error';
import { isValidLatencyHint } from '../helpers/is-valid-latency-hint';
import { IAudioContextOptions, IMinimalAudioContext } from '../interfaces';
import {
    UNPATCHED_AUDIO_CONTEXT_CONSTRUCTOR_PROVIDER,
    unpatchedAudioContextConstructor as nptchdDCntxtCnstrctr
} from '../providers/unpatched-audio-context-constructor';
import { WINDOW_PROVIDER } from '../providers/window';
import { TUnpatchedAudioContext } from '../types';
import { MinimalBaseAudioContext } from './minimal-base-audio-context';

const injector = Injector.create({
    providers: [
        INVALID_STATE_ERROR_FACTORY_PROVIDER,
        UNPATCHED_AUDIO_CONTEXT_CONSTRUCTOR_PROVIDER,
        WINDOW_PROVIDER
    ]
});

const invalidStateErrorFactory = injector.get(InvalidStateErrorFactory);
const unpatchedAudioContextConstructor = injector.get(nptchdDCntxtCnstrctr);

export class MinimalAudioContext extends MinimalBaseAudioContext implements IMinimalAudioContext {

    private _state: null | 'suspended';

    private _unpatchedAudioContext: TUnpatchedAudioContext;

    constructor (options: IAudioContextOptions = {}) {
        if (unpatchedAudioContextConstructor === null) {
            throw new Error(); // @todo
        }

        const unpatchedAudioContext = new unpatchedAudioContextConstructor(options);

        // Bug #51 Only Chrome and Opera throw an error if the given latencyHint is invalid.
        if (!isValidLatencyHint(options.latencyHint)) {
            throw new TypeError(
                `The provided value '${ options.latencyHint }' is not a valid enum value of type AudioContextLatencyCategory.`
            );
        }

        super(unpatchedAudioContext, unpatchedAudioContext.destination.channelCount);

        this._state = null;
        this._unpatchedAudioContext = unpatchedAudioContext;

        /*
         * Bug #34: Chrome and Opera pretend to be running right away, but fire an onstatechange event when the state actually
         * changes to 'running'.
         */
        if (unpatchedAudioContext.state === 'running') {
            this._state = 'suspended';

            const revokeState = () => {
                if (this._state === 'suspended') {
                    this._state = null;
                }

                if (unpatchedAudioContext.removeEventListener) {
                    unpatchedAudioContext.removeEventListener('statechange', revokeState);
                }
            };

            unpatchedAudioContext.addEventListener('statechange', revokeState);
        }
    }

    public get state () {
        return (this._state !== null) ? this._state : this._unpatchedAudioContext.state;
    }

    public close () {
        // Bug #35: Firefox does not throw an error if the AudioContext was closed before.
        if (this.state === 'closed') {
            return this._unpatchedAudioContext
                .close()
                .then(() => {
                    throw invalidStateErrorFactory.create();
                });
        }

        // Bug #34: If the state was set to suspended before it should be revoked now.
        if (this._state === 'suspended') {
            this._state = null;
        }

        return this._unpatchedAudioContext.close();
    }

}
