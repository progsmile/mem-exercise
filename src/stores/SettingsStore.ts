import { makeObservable, observable, action } from "mobx";
import { makePersistable } from 'mobx-persist-store';

class SettingsStore {
    randomWordsCount: number = 7

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
