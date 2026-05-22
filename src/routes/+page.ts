import type { PageLoad } from './$types';
import type { ModelEntry, TuneEntry } from '$lib/types';

export const load: PageLoad = async ({ fetch }) => {
    const [modelsRes, tunesRes] = await Promise.all([
        fetch('/models/manifest.json'),
        fetch('/audio/manifest.json')
    ]);

    const [models, tunes] = await Promise.all([
        modelsRes.json() as Promise<ModelEntry[]>,
        tunesRes.json() as Promise<TuneEntry[]>
    ]);

    return {
        models,
        tunes
    };
};
