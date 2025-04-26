import { Text as defaultText } from "../locale/lang/default";
import { textTransitionSignal } from "../nostro/textGlitch";

function lookupText(index, textDB) {
    let text = textDB;
    for (let i = 0; i < index.length; i++) {
        text = text[index[i]];
    }
    if (text === undefined || text === null) {
        throw new Error(`text not found for index: ${index} in text db: ${textDB["db-name"]}` );
    }
    return text;
}

export const plainText = (index, args) => {
    const resultText = lookupText(index, defaultText);
    if (args && args.length > 0) {
        return resultText(...args);
    } else {
        return resultText;
    }
};

export const textMaker = (index) => {
    return (myIndex, ...myArgs) => {
        var combinedIndex = [];
        if (typeof index === 'string' || index instanceof String) {
            combinedIndex.push(index);
        } else if (Array.isArray(index)) {
            combinedIndex = combinedIndex.concat(index);
        }
        
        if (typeof myIndex === 'string' || myIndex instanceof String) {
            combinedIndex.push(myIndex);
        } else if (Array.isArray(myIndex)) {
            combinedIndex = combinedIndex.concat(myIndex);
        }
        return plainText(combinedIndex, myArgs);
    };
}

export const Label = ({ index, args }) => {
    const [text, setText] = textTransitionSignal("");
    const resultText = lookupText(index, defaultText);
    if (args && args.length > 0) {
        setText(resultText(...args));
    } else {
        setText(resultText);
    }
    return <span>{text}</span>;
};

export const labelMaker = (index) => {
    return (myIndex, ...myArgs) => {
        var combinedIndex = [];
        if (typeof index === 'string' || index instanceof String) {
            combinedIndex.push(index);
        } else if (Array.isArray(index)) {
            combinedIndex = combinedIndex.concat(index);
        }
        
        if (typeof myIndex === 'string' || myIndex instanceof String) {
            combinedIndex.push(myIndex);
        } else if (Array.isArray(myIndex)) {
            combinedIndex = combinedIndex.concat(myIndex);
        }
        return <Label index={combinedIndex} args={myArgs} />;
    };
}