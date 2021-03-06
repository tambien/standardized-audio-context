import { ACTIVE_AUDIO_NODE_STORE, AUDIO_GRAPHS, AUDIO_NODE_STORE, CONTEXT_STORE, EVENT_LISTENERS } from '../../src/globals';

export const createScriptProcessor = (context, bufferSize, numberOfInputChannels, numberOfOutputChannels) => {
    const nativeContext = CONTEXT_STORE.get(context);
    const scriptProcessorNode = nativeContext.createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels);
    const scriptProcessorNodeProxy = new Proxy(scriptProcessorNode, {

        get (target, property) {
            if (property === 'connect' || property === 'disconnect') {
                return function (destination, ...args) {
                    target[property].call(target, AUDIO_NODE_STORE.get(destination), ...args);

                    if (property === 'connect') {
                        if (!ACTIVE_AUDIO_NODE_STORE.has(destination)) {
                            const eventListeners = EVENT_LISTENERS.get(destination);

                            ACTIVE_AUDIO_NODE_STORE.add(destination);

                            eventListeners.forEach((eventListener) => eventListener('active'));
                        }

                        const audioGraph = AUDIO_GRAPHS.get(context);
                        const { activeInputs } = audioGraph.nodes.get(destination);

                        activeInputs[ args[1] || 0 ].add([ destination, args[0] || 0 ]);

                        return destination;
                    }
                };
            }

            if (property === 'context') {
                return context;
            }

            return target[property];
        },

        set (target, property, value) {
            target[property] = value;

            return true;
        }

    });

    ACTIVE_AUDIO_NODE_STORE.add(scriptProcessorNodeProxy);
    AUDIO_NODE_STORE.set(scriptProcessorNodeProxy, scriptProcessorNode);
    EVENT_LISTENERS.set(scriptProcessorNodeProxy, new Set());

    const audioGraph = AUDIO_GRAPHS.get(context);

    if (audioGraph === undefined) {
        throw new Error('Missing the audio graph of the given context.');
    }

    const audioNodeConnections = { activeInputs: [ new Set() ], outputs: new Set(), passiveInputs: new WeakMap(), renderer: null };

    audioGraph.nodes.set(scriptProcessorNode, audioNodeConnections);
    audioGraph.nodes.set(scriptProcessorNodeProxy, audioNodeConnections);

    return scriptProcessorNodeProxy;
};
