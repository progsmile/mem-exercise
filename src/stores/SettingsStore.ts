import { makeObservable, observable, action } from "mobx";
import { makePersistable } from 'mobx-persist-store';

export const RANDOM_WORDS_COUNT = 7;
export const RANDOM_WORDS_COUNT_MIN = 5;
export const RANDOM_WORDS_COUNT_MAX = 12;


class SettingsStore {
    randomWordsCount: number = RANDOM_WORDS_COUNT;
    isSettingsOpen: boolean = false;

    constructor() {
        makeObservable(this, {
            randomWordsCount: observable,
            isSettingsOpen: observable,
            setRandomWordsCount: action,
            openSettings: action,
            closeSettings: action,
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

    openSettings(): void {
        this.isSettingsOpen = true;
    }

    closeSettings(): void {
        this.isSettingsOpen = false;
    }
}

const settingsStore = new SettingsStore();

export default settingsStore
