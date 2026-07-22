import { IPersonaProps } from "@fluentui/react/lib/Persona";
import { ValidationState } from "@fluentui/react/lib/Pickers";

const MASTER_PEOPLE_LIST: IPersonaProps[] = [];

export function doesTextStartWith(text: string, filterText: string): boolean {
    return text.toLowerCase().startsWith(filterText.toLowerCase());
}

export function removeDuplicates(personas: IPersonaProps[], possibleDupes: IPersonaProps[]): IPersonaProps[] {
    return personas.filter(persona => !listContainsPersona(persona, possibleDupes));
}

export function listContainsPersona(persona: IPersonaProps, personas: IPersonaProps[]): boolean {
    if (!personas?.length) {
        return false;
    }
    return personas.some(item => item.text === persona.text);
}

export function getTextFromItem(persona: IPersonaProps): string {
    return persona.text!;
}

export function validateInput(input: string): ValidationState {
    if (input.includes("@")) {
        return ValidationState.valid;
    } else if (input.length > 1) {
        return ValidationState.warning;
    }
    return ValidationState.invalid;
}

export function onInputChange(input: string): string {
    const outlookRegEx = /<.*>/g;
    const emailAddress = input.match(outlookRegEx);
    if (emailAddress?.[0]) {
        return emailAddress[0].substring(1, emailAddress[0].length - 1);
    }
    return input;
}

export function onFilterChanged(filterText: string, currentPersonas: IPersonaProps[]): IPersonaProps[] {
    if (filterText) {
        let filteredPersonas: IPersonaProps[] = MASTER_PEOPLE_LIST.filter(item =>
            doesTextStartWith(item.text ?? "", filterText)
        );
        filteredPersonas = removeDuplicates(filteredPersonas, currentPersonas);
        return filteredPersonas;
    } else {
        return [];
    }
}
