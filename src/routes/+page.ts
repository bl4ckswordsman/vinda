import type { PageLoad } from './$types';
import type { ModelEntry, TuneEntry } from '$lib/types';

export const load: PageLoad = async ({ fetch }) => {
    const [modelsRes, tunesRes] = await Promise.all([
        fetch('/models/manifest.json'),
        fetch('/audio/manifest.json')
    ]);

    const [models, publicTunes] = await Promise.all([
        modelsRes.json() as Promise<ModelEntry[]>,
        tunesRes.json() as Promise<TuneEntry[]>
    ]);

    let privateTunes: TuneEntry[] = [];
    try {
        const privateRes = await fetch('/audio/manifest-private.json');
        if (privateRes.ok) {
            privateTunes = await privateRes.json() as TuneEntry[];
        }
    } catch (e) {
        // manifest-private.json not present, ignore
    }

    return {
        models,
        tunes: [...publicTunes, ...privateTunes]
    };
};
