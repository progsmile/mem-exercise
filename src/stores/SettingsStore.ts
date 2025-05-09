import { makeObservable, observable, action } from "mobx";
import { makePersistable } from 'mobx-persist-store';

export const RANDOM_WORDS_COUNT = 7;
export const RANDOM_WORDS_COUNT_MIN = 5;
export const RANDOM_WORDS_COUNT_MAX = 12;


class SettingsStore {
    randomWordsCount: number = RANDOM_WORDS_COUNT

    constructor() {
        makeObservable(this, {
            randomWordsCount: observable,
            setRandomWordsCount: action,
        });

        makePersistable(this, {
            name: 'SettingsStore',
            properties: ['randomWordsCount'],
            storage: window.localStorage
        });
    }

    setRandomWordsCount(newCount: number): void {
        this.randomWordsCount = newCount;
    }
}

const settingsStore = new SettingsStore();

export default settingsStore
