'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var MotorLevels = [
    'C5', 'C6', 'C7', 'C8', 'T1',
    'L2', 'L3', 'L4', 'L5', 'S1',
];

var SensoryLevels = [
    'C1',
    'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8',
    'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12',
    'L1', 'L2', 'L3', 'L4', 'L5',
    'S1', 'S2', 'S3', 'S4_5',
];

var isAbnormalSensory = function (value) { return ['0', '1', '0*', '1*'].includes(value); };
var NTVariableSensory = function (value) { return ['0**', '1**'].includes(value); };
var NTNotVariableSensory = function (value) { return ['2', 'NT', 'NT**'].includes(value); };
var checkSensoryLevel = function (side, level, nextLevel, variable) {
    if (nextLevel === 'C1') {
        throw "invalid arguments level: " + level + " nextLevel: " + nextLevel;
    }
    if (side.lightTouch[nextLevel] === '2' && side.pinPrick[nextLevel] === '2') {
        return { "continue": true, variable: variable };
    }
    else if (isAbnormalSensory(side.lightTouch[nextLevel]) || isAbnormalSensory(side.pinPrick[nextLevel])) {
        return { "continue": false, level: level + (variable ? '*' : ''), variable: variable };
    }
    else if ([side.lightTouch[nextLevel], side.pinPrick[nextLevel]].includes('NT*')) {
        return { "continue": false, level: level + '*', variable: true };
    }
    else if (side.lightTouch[nextLevel] === 'NT' || side.pinPrick[nextLevel] === 'NT') {
        if (NTVariableSensory(side.lightTouch[nextLevel]) || NTVariableSensory(side.pinPrick[nextLevel])) {
            return { "continue": true, level: level + (variable ? '*' : ''), variable: true };
        }
        else if (NTNotVariableSensory(side.lightTouch[nextLevel]) || NTNotVariableSensory(side.pinPrick[nextLevel])) {
            return { "continue": true, level: level + (variable ? '*' : ''), variable: variable };
        }
        else {
            throw '';
        }
    }
    else {
        return { "continue": true, variable: true };
    }
};
/**
 * 1. step through each level
 *    a. If next PP and LT are both considered normal then continue to next level
 *    b. If next PP and LT contains NT and does not contain abnormal then add current level to list then continue to next level
 *    c. Else one of next PP and LT is altered then add current level to list then stop
 *       i. if next PP and LT both
 *    d. If reached last level (S4_5) then add current level to list
 * 2. return current list
 */
var determineSensoryLevel = function (side) {
    var levels = [];
    var variable = false;
    for (var i = 0; i < SensoryLevels.length; i++) {
        var level = SensoryLevels[i];
        var nextLevel = SensoryLevels[i + 1];
        if (nextLevel) {
            var result = checkSensoryLevel(side, level, nextLevel, variable);
            variable = variable || !!result.variable;
            if (result.level) {
                levels.push(result.level);
            }
            if (result["continue"]) {
                continue;
            }
            else {
                break;
            }
        }
        else {
            // reached end of SensoryLevels
            levels.push('INT' + (variable ? '*' : ''));
        }
    }
    return levels.join(',');
};

/**
 * `['0', 'NT', '0*', 'NT*'].includes(value)`
 */
var canBeAbsentSensory = function (value) { return ['0', 'NT', '0*', 'NT*'].includes(value); };
/**
 * `['2','NT**','0**','1**'].includes(value)`
 */
var isNormalSensory = function (value) { return ['2', 'NT**', '0**', '1**'].includes(value); };
var levelIsBetween = function (index, firstLevel, lastLevel) {
    return index >= SensoryLevels.indexOf(firstLevel) && index <= SensoryLevels.indexOf(lastLevel);
};

var checkMotorLevel = function (side, level, nextLevel, variable) {
    if (['0', '1', '2'].includes(side.motor[level])) {
        throw new Error("Invalid motor value at current level");
    }
    var result = { "continue": false, variable: variable };
    if (!['0', '1', '2'].includes(side.motor[level])) {
        if (!['0*', '1*', '2*', 'NT*', '3', '4', '3*', '4*'].includes(side.motor[level])) {
            if (!['0', '1', '2'].includes(side.motor[nextLevel])) {
                result["continue"] = true;
            }
        }
    }
    if (!(['5', '0**', '1**', '2**', '3**', '4**', 'NT**'].includes(side.motor[level]) && !['0', '1', '2', '0*', '1*', '2*', 'NT', 'NT*'].includes(side.motor[nextLevel]))) {
        if (['0*', '1*', '2*', 'NT*'].includes(side.motor[level]) || (['0**', '1**', '2**'].includes(side.motor[level]) && ['0*', '1*', '2*', 'NT', 'NT*'].includes(side.motor[nextLevel]))) {
            result.level = level + '*';
        }
        else {
            result.level = level + (variable ? '*' : '');
        }
    }
    if (!['5', '3', '4', '3*', '4*', 'NT'].includes(side.motor[level])) {
        if (['0**', '1**', '2**', '3**', '4**', 'NT**'].includes(side.motor[level])) {
            if (!['0', '1', '2'].includes(side.motor[nextLevel])) {
                result.variable = true;
            }
        }
        else {
            result.variable = true;
        }
    }
    else if (side.motor[level] === '5' && ['0**', '1**', '2**'].includes(side.motor[nextLevel])) {
        result.variable = true;
    }
    return result;
};
var checkMotorLevelBeforeStartOfKeyMuscles = function (side, level, nextLevel, variable) {
    return {
        "continue": !['0', '1', '2'].includes(side.motor[nextLevel]),
        level: ['0', '1', '2', '0*', '1*', '2*', 'NT', 'NT*'].includes(side.motor[nextLevel]) ? level + (variable ? '*' : '') : undefined,
        variable: variable || ['0**', '1**', '2**'].includes(side.motor[nextLevel]),
    };
};
var checkMotorLevelUsingSensoryValues = function (side, firstMotorLevelOfMotorBlock) {
    var startIndex = SensoryLevels.indexOf(firstMotorLevelOfMotorBlock) - 1;
    var result = { "continue": true, variable: false };
    for (var i = startIndex; i <= startIndex + 5; i++) {
        var level = SensoryLevels[i];
        var nextLevel = SensoryLevels[i + 1];
        var currentLevelResult = checkSensoryLevel(side, level, nextLevel, false);
        if (currentLevelResult["continue"] === false) {
            result["continue"] = false;
        }
        if (currentLevelResult.level) {
            result.level = currentLevelResult.level;
        }
        if (currentLevelResult.variable) {
            result.variable = true;
        }
    }
    return result;
};
var checkWithSensoryCheckLevelResult = function (side, level, variable, sensoryCheckLevelResult) {
    var result = { "continue": true, variable: variable };
    if ((['3', '4', '0*', '1*', '2*', '3*', '4*', 'NT*'].includes(side.motor[level]) || !sensoryCheckLevelResult["continue"])) {
        result["continue"] = false;
    }
    if (side.motor[level] === 'NT' || !(['5', '0**', '1**', '2**', '3**', '4**', 'NT**'].includes(side.motor[level]) && sensoryCheckLevelResult["continue"] && !sensoryCheckLevelResult.level)) {
        if (['0*', '1*', '2*', 'NT*'].includes(side.motor[level]) ||
            (['0**', '1**', '2**'].includes(side.motor[level]) &&
                (sensoryCheckLevelResult.level || !sensoryCheckLevelResult["continue"]))) {
            result.level = level + '*';
        }
        else {
            result.level = level + (variable ? '*' : '');
        }
    }
    if (['0*', '1*', '2*', 'NT*', '0**', '1**', '2**'].includes(side.motor[level]) || (['3**', '4**', 'NT**'].includes(side.motor[level]) && sensoryCheckLevelResult["continue"]) || (['5', 'NT'].includes(side.motor[level]) &&
        (sensoryCheckLevelResult["continue"] && sensoryCheckLevelResult.variable && !sensoryCheckLevelResult.level))) {
        result.variable = true;
    }
    return result;
};
var checkMotorLevelAtEndOfKeyMuscles = function (side, level, variable) {
    if (['0', '1', '2'].includes(side.motor[level])) {
        throw new Error("Invalid motor value at current level");
    }
    var firstMotorLevelOfMotorBlock = level === 'T1' ? 'C5' : 'L2';
    var sensoryCheckLevelResult = checkMotorLevelUsingSensoryValues(side, firstMotorLevelOfMotorBlock);
    return checkWithSensoryCheckLevelResult(side, level, variable, sensoryCheckLevelResult);
};
/** TODO
 * 1. step through each level
 *    a. ...
 * 2. return current list
 */
var determineMotorLevel = function (side) {
    var levels = [];
    var level;
    var nextLevel;
    var result;
    var variable = false;
    for (var i = 0; i < SensoryLevels.length; i++) {
        level = SensoryLevels[i];
        nextLevel = SensoryLevels[i + 1];
        // check sensory
        if (levelIsBetween(i, 'C1', 'C3') || levelIsBetween(i, 'T2', 'T12') || levelIsBetween(i, 'S2', 'S3')) {
            result = checkSensoryLevel(side, level, nextLevel, variable);
        }
        // check before key muscles
        else if (level === 'C4' || level === 'L1') {
            nextLevel = level === 'C4' ? 'C5' : 'L2';
            result = checkMotorLevelBeforeStartOfKeyMuscles(side, level, nextLevel, variable);
        }
        // check motor
        else if (levelIsBetween(i, 'C5', 'C8') || levelIsBetween(i, 'L2', 'L5')) {
            // level = C5 to C8
            var index = i - (levelIsBetween(i, 'C5', 'C8') ? 4 : 16);
            level = MotorLevels[index];
            nextLevel = MotorLevels[index + 1];
            result = checkMotorLevel(side, level, nextLevel, variable);
        }
        // check at end of key muscles
        else if (level === 'T1' || level === 'S1') {
            result = checkMotorLevelAtEndOfKeyMuscles(side, level, variable);
        }
        else {
            result = { "continue": false, level: 'INT' + (variable ? '*' : ''), variable: variable };
        }
        variable = variable || result.variable;
        if (result.level) {
            levels.push(result.level);
        }
        if (result["continue"]) {
            continue;
        }
        else {
            return levels.join(',');
        }
    }
    return levels.join(',');
};

var determineNeurologicalLevels = function (exam) {
    var sensoryRight = determineSensoryLevel(exam.right);
    var sensoryLeft = determineSensoryLevel(exam.left);
    var motorRight = determineMotorLevel(exam.right);
    var motorLeft = determineMotorLevel(exam.left);
    return { sensoryRight: sensoryRight, sensoryLeft: sensoryLeft, motorRight: motorRight, motorLeft: motorLeft };
};

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
}

var isAbsentSensory = function (value) { return value === '0'; };
var checkLevelForSensoryZPP = function (side, level, variable) {
    if (level === 'C1') {
        throw "invalid argument level: " + level;
    }
    var currentLevelPinPrickIsAbsent = isAbsentSensory(side.pinPrick[level]);
    var currentLevelLightTouchIsAbsent = isAbsentSensory(side.lightTouch[level]);
    if (currentLevelPinPrickIsAbsent && currentLevelLightTouchIsAbsent) {
        // TODO: remove hard coded variable
        return { "continue": true, variable: variable };
    }
    if (!canBeAbsentSensory(side.pinPrick[level]) || !canBeAbsentSensory(side.lightTouch[level])) {
        // TODO: remove hard coded variable
        return { "continue": false, level: level + (variable ? '*' : ''), variable: variable };
    }
    else {
        // TODO: remove hard coded variable
        var foundSomeNT = [side.pinPrick[level], side.lightTouch[level]].some(function (v) { return ['NT', 'NT*'].includes(v); });
        if (foundSomeNT) {
            return { "continue": true, level: level + (variable ? '*' : ''), variable: variable };
        }
        else {
            return { "continue": true, level: level + '*', variable: variable || !foundSomeNT };
        }
    }
};
var determineSensoryZPP = function (side, deepAnalPressure) {
    var zpp = [];
    var variable = false;
    if ((deepAnalPressure === 'No' || deepAnalPressure === 'NT') && canBeAbsentSensory(side.lightTouch.S4_5) && canBeAbsentSensory(side.pinPrick.S4_5)) {
        var sacralResult = checkLevelForSensoryZPP(side, 'S4_5', variable);
        if (deepAnalPressure === 'NT' ||
            (deepAnalPressure === 'No' && (!sacralResult["continue"] || sacralResult.level !== undefined))) {
            zpp.push('NA');
        }
        var levels = [];
        for (var i = SensoryLevels.indexOf('S3'); i >= 0; i--) {
            var level = SensoryLevels[i];
            // if not level !== C1
            if (i > 0) {
                var result = checkLevelForSensoryZPP(side, level, variable);
                variable = variable || result.variable;
                if (result.level) {
                    levels.unshift(result.level);
                }
                if (result["continue"]) {
                    continue;
                }
                else {
                    break;
                }
            }
            else {
                // reached end of SensoryLevels
                levels.unshift(level);
            }
        }
        zpp = __spreadArrays(zpp, levels);
        return zpp.join(',');
    }
    else {
        return 'NA';
    }
};

/**
 * `['5', 'NT', '0**', '1**', '2**', '3**', '4**', 'NT**'].includes(value)`
 */
var isNormalMotor = function (value) { return ['5', '0**', '1**', '2**', '3**', '4**', 'NT**'].includes(value); };
/**
 * `['5', 'NT', '0**', '1**', '2**', '3**', '4**', 'NT**'].includes(value)`
 */
var canBeNormalMotor = function (value) { return ['5', 'NT', '0**', '1**', '2**', '3**', '4**', 'NT**'].includes(value); };
/**
 * `['0', '0*', 'NT', 'NT*'].includes(value)`
 */
var canBeParalyzedMotor = function (value) { return ['0', '0*', 'NT', 'NT*'].includes(value); };
/**
 * `['2', 'NT', '0**', '1**', 'NT**'].includes(value)`
 */
var canBeNormalSensory = function (value) { return ['2', 'NT', '0**', '1**', 'NT**'].includes(value); };
var checkLevelForMotorZPP = function (side, level, variable) {
    var result = { "continue": true, variable: variable };
    if (side.motor[level] === '0') {
        return result;
    }
    if (!['0*', 'NT', 'NT*'].includes(side.motor[level])) {
        result["continue"] = false;
    }
    if (['0*', '0**'].includes(side.motor[level])) {
        result.level = level + '*';
    }
    else {
        result.level = level + (variable ? '*' : '');
    }
    if (['0*', '0**'].includes(side.motor[level])) {
        result.variable = true;
    }
    return result;
};
var checkLevelForMotorZPPOnSensory = function (side, level, variable, extremityIsAllNormal, extremityCanBeAllNormal, extremityCanBeAllParalyzed) {
    if (level === 'C1') {
        throw "invalid argument level: " + level;
    }
    var result = {
        "continue": true,
        variable: false,
    };
    var canBeNormalLightTouch = canBeNormalSensory(side.lightTouch[level]);
    var canBeNormalPinPrick = canBeNormalSensory(side.pinPrick[level]);
    if (canBeNormalLightTouch && canBeNormalPinPrick) {
        if (extremityCanBeAllNormal) {
            if (extremityIsAllNormal || extremityCanBeAllParalyzed || side.lightTouch[level] === 'NT' || side.pinPrick[level] === 'NT') {
                result.level = level + (variable ? '*' : '');
                if (extremityIsAllNormal && side.lightTouch[level] !== 'NT' && side.pinPrick[level] !== 'NT') {
                    result["continue"] = false;
                }
            }
            return result;
        }
        else if (side.lightTouch[level] !== 'NT' || side.pinPrick[level] !== 'NT') {
            return { "continue": true, variable: variable };
        }
        if (side.lightTouch[level] === 'NT' || side.pinPrick[level] === 'NT') {
            return { "continue": true, level: level + (variable ? '*' : ''), variable: variable };
        }
        else {
            return { "continue": false, level: level + (variable ? '*' : ''), variable: variable };
        }
    }
    else {
        return { "continue": true, variable: variable };
    }
};
var checkLowestNonKeyMuscleWithMotorFunction = function (levels, lowestNonKeyMuscleWithMotorFunction) {
    if (lowestNonKeyMuscleWithMotorFunction) {
        var indexes = levels.map(function (s) { return SensoryLevels.indexOf(s.replace(/\*/, '')); });
        var lowestNonKeyMuscleWithMotorFunctionIndex_1 = SensoryLevels.indexOf(lowestNonKeyMuscleWithMotorFunction);
        return indexes.every(function (i) { return i <= lowestNonKeyMuscleWithMotorFunctionIndex_1; });
    }
    else {
        return false;
    }
};
var getCanBeConsecutivelyBeNormalDownTo = function (side) {
    var result = { "continue": true, level: 'S4_5', variable: false };
    for (var i = SensoryLevels.indexOf('C2'); i < SensoryLevels.length; i++) {
        if (levelIsBetween(i, 'C5', 'T1') || levelIsBetween(i, 'L2', 'S1')) {
            var index = i - (levelIsBetween(i, 'C5', 'T1') ? 4 : 16);
            var level = MotorLevels[index];
            if (side.motor[level] === '0**' || ['0**', '1**', 'NT**'].includes(side.lightTouch[level]) || ['0**', '1**', 'NT**'].includes(side.pinPrick[level])) {
                result.variable = true;
            }
            if (!canBeNormalMotor(side.motor[level]) || !canBeNormalSensory(side.lightTouch[level]) || !canBeNormalSensory(side.pinPrick[level])) {
                result.level = SensoryLevels[i - 1];
                break;
            }
        }
        else {
            var level = SensoryLevels[i];
            if (level === 'C1') {
                throw "invalid argument level: " + level;
            }
            if (['0**', '1**', 'NT**'].includes(side.lightTouch[level]) || ['0**', '1**', 'NT**'].includes(side.pinPrick[level])) {
                result.variable = true;
            }
            if (!canBeNormalSensory(side.lightTouch[level]) || !canBeNormalSensory(side.pinPrick[level])) {
                result.level = SensoryLevels[i - 1];
                break;
            }
        }
    }
    return result;
};
var isAllNormalExtremity = function (side, option) {
    var startingMotorIndex, startingSensoryIndex;
    switch (option) {
        case 'upper':
            startingMotorIndex = MotorLevels.indexOf('C5');
            startingSensoryIndex = SensoryLevels.indexOf('C5');
            break;
        case 'lower':
            startingMotorIndex = MotorLevels.indexOf('L2');
            startingSensoryIndex = SensoryLevels.indexOf('L2');
            break;
        default:
            throw 'invalid option';
    }
    for (var i = startingMotorIndex; i < startingMotorIndex + 5; i++) {
        var level = MotorLevels[i];
        if (!isNormalMotor(side.motor[level])) {
            return false;
        }
    }
    for (var i = startingSensoryIndex; i < startingSensoryIndex + 5; i++) {
        var level = SensoryLevels[i];
        if (level === 'C1' || !isNormalSensory(side.pinPrick[level]) || !isNormalSensory(side.lightTouch[level])) {
            return false;
        }
    }
    return true;
};
var canBeAllNormalExtremity = function (side, option) {
    var startingIndex, startingSensoryIndex;
    switch (option) {
        case 'upper':
            startingIndex = MotorLevels.indexOf('C5');
            startingSensoryIndex = SensoryLevels.indexOf('C5');
            break;
        case 'lower':
            startingIndex = MotorLevels.indexOf('L2');
            startingSensoryIndex = SensoryLevels.indexOf('L2');
            break;
        default:
            throw 'invalid option';
    }
    for (var i = startingIndex; i < startingIndex + 5; i++) {
        var level = MotorLevels[i];
        if (!canBeNormalMotor(side.motor[level])) {
            return false;
        }
    }
    for (var i = startingSensoryIndex; i < startingSensoryIndex + 5; i++) {
        var level = SensoryLevels[i];
        if (level === 'C1' || !canBeNormalSensory(side.pinPrick[level]) || !canBeNormalSensory(side.lightTouch[level])) {
            return false;
        }
    }
    return true;
};
var canBeAllParalyzedExtremity = function (side, option) {
    var startingIndex;
    switch (option) {
        case 'upper':
            startingIndex = MotorLevels.indexOf('C5');
            break;
        case 'lower':
            startingIndex = MotorLevels.indexOf('L2');
            break;
        default:
            throw 'invalid option';
    }
    for (var i = startingIndex; i < startingIndex + 5; i++) {
        var level = MotorLevels[i];
        if (!canBeParalyzedMotor(side.motor[level])) {
            return false;
        }
    }
    return true;
};
var hasImpairedExtremity = function (side, option) {
    var startingIndex;
    switch (option) {
        case 'upper':
            startingIndex = MotorLevels.indexOf('C5');
            break;
        case 'lower':
            startingIndex = MotorLevels.indexOf('L2');
            break;
        default:
            throw 'invalid option';
    }
    for (var i = startingIndex; i < startingIndex + 5; i++) {
        var level = MotorLevels[i];
        if (['0', '1', '2', '3', '4', '0*', '1*', '2*', '3*', '4*'].includes(side.motor[level])) {
            return true;
        }
    }
    return false;
};
var findStartingIndex = function (side) {
    for (var i = MotorLevels.length - 1; i >= 0; i--) {
        var level = MotorLevels[i];
        if (side.motor[level] !== '0') {
            if (level === 'S1') {
                return SensoryLevels.indexOf('S3');
            }
            else if (level === 'T1') {
                return SensoryLevels.indexOf('L1');
            }
            else {
                return SensoryLevels.indexOf(level);
            }
        }
    }
    return SensoryLevels.indexOf('S3');
};
// contains side-effect code for result and levels
var checkMotorsOnly = function (side, levels, result, option) {
    var startingIndex = -1;
    var variable = false;
    var startingMotorIndex = option === 'upper' ? MotorLevels.indexOf('T1') : MotorLevels.length - 1;
    var endingMotorIndex = option === 'upper' ? 0 : MotorLevels.indexOf('L2');
    for (var i = startingMotorIndex; i >= endingMotorIndex; i--) {
        var level = MotorLevels[i];
        result = checkLevelForMotorZPP(side, level, variable);
        variable = variable || result.variable;
        if (result.level) {
            levels.unshift(result.level);
        }
        if (!result["continue"]) {
            startingIndex = -1;
            break;
        }
        else {
            startingIndex = SensoryLevels.indexOf(level);
        }
    }
    return startingIndex;
};
/**
 * TODO
 * 1. Check VAC value and S4_5 values
 * 2. Check Lower motor values
 *   a. if can be normal check
 *
 * @param side
 * @param voluntaryAnalContraction
 */
var determineMotorZPP = function (side, voluntaryAnalContraction) {
    if (voluntaryAnalContraction === 'Yes') {
        return 'NA';
    }
    else {
        var zpp = [];
        var canBeConsecutivelyBeNormalDownTo = getCanBeConsecutivelyBeNormalDownTo(side);
        var upperExtremityIsAllNormal = isAllNormalExtremity(side, 'upper');
        var lowerExtremityIsAllNormal = isAllNormalExtremity(side, 'lower');
        var upperExtremityCanBeAllNormal = canBeAllNormalExtremity(side, 'upper');
        var lowerExtremityCanBeAllNormal = canBeAllNormalExtremity(side, 'lower');
        var upperExtremityCanBeAllParalyzed = canBeAllParalyzedExtremity(side, 'upper');
        var lowerExtremityCanBeAllParalyzed = canBeAllParalyzedExtremity(side, 'lower');
        var levels = [];
        var level = void 0;
        // TODO: remove hard coded variable
        var result = { "continue": true, variable: false };
        if (voluntaryAnalContraction === 'NT' ||
            (voluntaryAnalContraction === 'No' && canBeConsecutivelyBeNormalDownTo.level === 'S4_5')) {
            zpp.push('NA');
            result = checkLevelForMotorZPPOnSensory(side, 'S4_5', false, lowerExtremityIsAllNormal, upperExtremityCanBeAllNormal && lowerExtremityCanBeAllNormal, false);
        }
        if (side.lowestNonKeyMuscleWithMotorFunction &&
            checkLowestNonKeyMuscleWithMotorFunction(levels, side.lowestNonKeyMuscleWithMotorFunction)) {
            return side.lowestNonKeyMuscleWithMotorFunction;
        }
        var startingIndex = findStartingIndex(side);
        var variable = canBeConsecutivelyBeNormalDownTo.variable;
        if (hasImpairedExtremity(side, 'lower') || hasImpairedExtremity(side, 'upper')) {
            // only check motor levels
            startingIndex = checkMotorsOnly(side, levels, result, 'lower');
        }
        if (startingIndex >= 0 && hasImpairedExtremity(side, 'upper')) {
            // only check motor levels
            startingIndex = checkMotorsOnly(side, levels, result, 'upper');
        }
        // start iteration from bottom
        for (var i = startingIndex; i >= 0; i--) {
            if (!result["continue"]) {
                break;
            }
            level = SensoryLevels[i];
            // check sensory
            if (levelIsBetween(i, 'C2', 'C4')) {
                result = checkLevelForMotorZPPOnSensory(side, level, variable, true, true, upperExtremityCanBeAllParalyzed);
                if (result.level) {
                    upperExtremityCanBeAllParalyzed = false;
                }
            }
            else if (levelIsBetween(i, 'T2', 'L1')) {
                result = checkLevelForMotorZPPOnSensory(side, level, variable, upperExtremityIsAllNormal, upperExtremityCanBeAllNormal, lowerExtremityCanBeAllParalyzed);
                if (result.level) {
                    lowerExtremityCanBeAllParalyzed = false;
                }
            }
            else if (levelIsBetween(i, 'S2', 'S3')) {
                result = checkLevelForMotorZPPOnSensory(side, level, variable, lowerExtremityIsAllNormal, upperExtremityCanBeAllNormal && lowerExtremityCanBeAllNormal, false);
            }
            // check motor
            else if (levelIsBetween(i, 'C5', 'T1') || levelIsBetween(i, 'L2', 'S1')) {
                // level = C5 to C8
                var index = i - (levelIsBetween(i, 'C5', 'T1') ? 4 : 16);
                level = MotorLevels[index];
                result = checkLevelForMotorZPP(side, level, variable);
            }
            // level = C1
            else {
                // TODO: remove hard coded variable
                result = { "continue": false, level: 'C1', variable: false };
            }
            if (result.level) {
                levels.unshift(result.level);
            }
            variable = variable || result.variable;
        }
        zpp = __spreadArrays(zpp, levels.sort(function (a, b) { return SensoryLevels.indexOf(a.replace(/\*/, '')) - SensoryLevels.indexOf(b.replace(/\*/, '')); }));
        return zpp.join(',');
    }
};

var determineZoneOfPartialPreservations = function (exam) {
    var sensoryRight = determineSensoryZPP(exam.right, exam.deepAnalPressure);
    var sensoryLeft = determineSensoryZPP(exam.left, exam.deepAnalPressure);
    var motorRight = determineMotorZPP(exam.right, exam.voluntaryAnalContraction);
    var motorLeft = determineMotorZPP(exam.left, exam.voluntaryAnalContraction);
    return { sensoryRight: sensoryRight, sensoryLeft: sensoryLeft, motorRight: motorRight, motorLeft: motorLeft };
};

var checkLevelWithoutMotor = function (level, leftSensoryResult, rightSensoryResult, variable) {
    var resultLevel;
    if (leftSensoryResult.level || rightSensoryResult.level) {
        if (leftSensoryResult.level && rightSensoryResult.level &&
            leftSensoryResult.level.includes('*') && rightSensoryResult.level.includes('*')) {
            resultLevel = level + '*';
        }
        else {
            resultLevel = level + (variable ? '*' : '');
        }
    }
    return {
        "continue": leftSensoryResult["continue"] && rightSensoryResult["continue"],
        level: resultLevel,
        variable: variable || leftSensoryResult.variable || rightSensoryResult.variable,
    };
};
var checkLevelWithMotor = function (exam, level, sensoryResult, variable) {
    if (!sensoryResult["continue"]) {
        return sensoryResult;
    }
    else {
        var i = SensoryLevels.indexOf(level);
        var index = i - (levelIsBetween(i, 'C4', 'T1') ? 4 : 16);
        var motorLevel = MotorLevels[index];
        var nextMotorLevel = MotorLevels[index + 1];
        var leftMotorResult = level === 'C4' || level === 'L1' ?
            checkMotorLevelBeforeStartOfKeyMuscles(exam.left, level, nextMotorLevel, variable) :
            level === 'T1' || level === 'S1' ?
                checkMotorLevel(exam.left, motorLevel, motorLevel, variable) :
                checkMotorLevel(exam.left, motorLevel, nextMotorLevel, variable);
        var rightMotorResult = level === 'C4' || level === 'L1' ?
            checkMotorLevelBeforeStartOfKeyMuscles(exam.left, level, nextMotorLevel, variable) :
            level === 'T1' || level === 'S1' ?
                checkMotorLevel(exam.right, motorLevel, motorLevel, variable) : // TODO: hotfix
                checkMotorLevel(exam.right, motorLevel, nextMotorLevel, variable);
        var resultLevel = void 0;
        if (leftMotorResult.level || rightMotorResult.level || sensoryResult.level) {
            if (leftMotorResult.level && rightMotorResult.level &&
                leftMotorResult.level.includes('*') && rightMotorResult.level.includes('*')) {
                resultLevel = level + '*';
            }
            else {
                resultLevel = level + (variable ? '*' : '');
            }
        }
        return {
            "continue": leftMotorResult["continue"] && rightMotorResult["continue"],
            level: resultLevel,
            variable: variable || sensoryResult.variable || leftMotorResult.variable || rightMotorResult.variable,
        };
    }
};
var determineNeurologicalLevelOfInjury = function (exam) {
    var listOfNLI = [];
    var variable = false;
    for (var i = 0; i < SensoryLevels.length; i++) {
        var level = SensoryLevels[i];
        var nextLevel = SensoryLevels[i + 1];
        var result = {
            "continue": true,
            variable: false,
        };
        if (!nextLevel) {
            listOfNLI.push('INT' + (variable ? '*' : ''));
        }
        else {
            var leftSensoryResult = checkSensoryLevel(exam.left, level, nextLevel, variable);
            var rightSensoryResult = checkSensoryLevel(exam.right, level, nextLevel, variable);
            if (levelIsBetween(i, 'C4', 'T1') || levelIsBetween(i, 'L1', 'S1')) {
                var sensoryResult = checkLevelWithoutMotor(level, leftSensoryResult, rightSensoryResult, variable);
                result = checkLevelWithMotor(exam, level, sensoryResult, variable);
            }
            else {
                result = checkLevelWithoutMotor(level, leftSensoryResult, rightSensoryResult, variable);
            }
            variable = variable || result.variable;
            if (result.level) {
                listOfNLI.push(result.level);
            }
            if (!result["continue"]) {
                break;
            }
        }
    }
    return listOfNLI.join(',');
};

var determineInjuryComplete = function (exam) {
    var rightLightTouchCanBeAbsent = canBeAbsentSensory(exam.right.lightTouch.S4_5);
    var rightPinPrickCanBeAbsent = canBeAbsentSensory(exam.right.pinPrick.S4_5);
    var leftLightTouchCanBeAbsent = canBeAbsentSensory(exam.left.lightTouch.S4_5);
    var leftPinPrickCanBeAbsent = canBeAbsentSensory(exam.left.pinPrick.S4_5);
    if (exam.voluntaryAnalContraction !== 'Yes' && exam.deepAnalPressure !== 'Yes' &&
        rightLightTouchCanBeAbsent && rightPinPrickCanBeAbsent &&
        leftLightTouchCanBeAbsent && leftPinPrickCanBeAbsent) {
        if (exam.voluntaryAnalContraction === 'No' && exam.deepAnalPressure === 'No') {
            if ([
                exam.right.lightTouch.S4_5,
                exam.right.pinPrick.S4_5,
                exam.left.lightTouch.S4_5,
                exam.left.pinPrick.S4_5
            ].every(function (v) { return v === '0'; })) {
                return 'C';
            }
            else if ([
                exam.right.lightTouch.S4_5,
                exam.right.pinPrick.S4_5,
                exam.left.lightTouch.S4_5,
                exam.left.pinPrick.S4_5
            ].every(function (v) { return ['0', '0*'].includes(v); })) {
                return 'C*,I*';
            }
        }
        return 'C,I';
    }
    else {
        // return 'I';
        if (exam.voluntaryAnalContraction === 'No' && exam.deepAnalPressure === 'No' && [
            exam.right.lightTouch.S4_5,
            exam.right.pinPrick.S4_5,
            exam.left.lightTouch.S4_5,
            exam.left.pinPrick.S4_5
        ].every(function (v) { return ['0', '0**'].includes(v); })) {
            return 'I*';
        }
        else {
            return 'I';
        }
    }
};

var startingMotorIndex = function (sensoryIndex) {
    return levelIsBetween(sensoryIndex, 'C2', 'C4') ? 0 :
        levelIsBetween(sensoryIndex, 'C5', 'T1') ? sensoryIndex - 4 :
            levelIsBetween(sensoryIndex, 'T2', 'L1') ? 5 :
                levelIsBetween(sensoryIndex, 'L2', 'S1') ? sensoryIndex - 16 : MotorLevels.length;
};
var isSensoryPreserved = function (exam) {
    var sensoryAtS45 = [
        exam.right.lightTouch.S4_5,
        exam.right.pinPrick.S4_5,
        exam.left.lightTouch.S4_5,
        exam.left.pinPrick.S4_5,
    ];
    return {
        result: exam.deepAnalPressure !== 'No' ||
            exam.right.lightTouch.S4_5 !== '0' || exam.right.pinPrick.S4_5 !== '0' ||
            exam.left.lightTouch.S4_5 !== '0' || exam.left.pinPrick.S4_5 !== '0',
        variable: exam.deepAnalPressure === 'No' && !sensoryAtS45.every(function (v) { return v === '0'; }) && sensoryAtS45.every(function (v) { return ['0', '0*', '0**'].includes(v); }),
    };
};

var canBeInjuryComplete = function (injuryComplete) { return injuryComplete.includes('C'); };
var checkASIAImpairmentScaleA = function (injuryComplete) {
    if (canBeInjuryComplete(injuryComplete)) {
        if (injuryComplete.includes('*')) {
            return 'A*';
        }
        else {
            return 'A';
        }
    }
};

/**
 * ```!['0', 'NT', 'NT*', '0*'].includes(value)```
 */
var canBeNoPreservedMotor = function (value) { return !['0', 'NT', 'NT*', '0*'].includes(value); };
var canHaveNoMotorFunctionMoreThanThreeLevelsBelow = function (motor, motorLevel) {
    var variable = false;
    for (var _i = 0, _a = motorLevel.split(','); _i < _a.length; _i++) {
        var m = _a[_i];
        var index = SensoryLevels.indexOf(m.replace('*', '')) + 4;
        var startingIndex = startingMotorIndex(index);
        var thereCanBeNoMotorFunction = true;
        for (var i = startingIndex; i < MotorLevels.length; i++) {
            var level = MotorLevels[i];
            if (motor[level] === '0*' || motor[level] === '0**') {
                variable = true;
            }
            if (canBeNoPreservedMotor(motor[level])) {
                thereCanBeNoMotorFunction = false;
                if (motor[level] === '0*') {
                    variable = true;
                }
                break;
            }
        }
        if (thereCanBeNoMotorFunction) {
            return {
                result: true,
                variable: variable,
            };
        }
    }
    return {
        result: false,
        variable: false,
    };
};
var motorCanBeNotPreserved = function (exam, neurologicalLevels) {
    var leftMotorFunctionResult = canHaveNoMotorFunctionMoreThanThreeLevelsBelow(exam.left.motor, neurologicalLevels.motorLeft);
    var rightMotorFunctionResult = canHaveNoMotorFunctionMoreThanThreeLevelsBelow(exam.right.motor, neurologicalLevels.motorRight);
    return {
        result: exam.voluntaryAnalContraction !== 'Yes' &&
            rightMotorFunctionResult.result &&
            leftMotorFunctionResult.result,
        variable: exam.voluntaryAnalContraction === 'No' &&
            (leftMotorFunctionResult.variable || rightMotorFunctionResult.variable),
    };
};
/**
 * Check AIS can be B i.e. Is injury Motor Complete?
 */
var canBeSensoryIncomplete = function (exam, neurologicalLevels) {
    var isSensoryPreservedResult = isSensoryPreserved(exam);
    var motorCanBeNotPreservedResult = motorCanBeNotPreserved(exam, neurologicalLevels);
    return {
        result: isSensoryPreservedResult.result && motorCanBeNotPreservedResult.result,
        variable: isSensoryPreservedResult.variable || motorCanBeNotPreservedResult.variable,
    };
};
var checkASIAImpairmentScaleB = function (exam, neurologicalLevels) {
    var canBeSensoryIncompleteResult = canBeSensoryIncomplete(exam, neurologicalLevels);
    if (canBeSensoryIncompleteResult.result) {
        if (canBeSensoryIncompleteResult.variable) {
            return 'B*';
        }
        else {
            return 'B';
        }
    }
};

var canHaveMuscleGradeLessThan3 = function (value) { return ['0', '1', '2', 'NT', 'NT*'].includes(value); };
var canHaveVariableMuscleGradeLessThan3 = function (value) { return ['0*', '1*', '2*'].includes(value); };
/**
 * Means in other words more than half of key muscles below NLI can have MuscleGradeLessThan3
 */
var canHaveLessThanHalfOfKeyMuscleFunctionsBelowNLIHaveMuscleGradeAtLeast3 = function (exam, neurologicalLevelOfInjury) {
    for (var _i = 0, _a = neurologicalLevelOfInjury.replace(/\*/g, '').split(','); _i < _a.length; _i++) {
        var nli = _a[_i];
        var indexOfNLI = SensoryLevels.indexOf(nli);
        var startIndex = startingMotorIndex(indexOfNLI + 1);
        var half = MotorLevels.length - startIndex;
        var count = 0;
        var variableCount = 0;
        for (var i = startIndex; i < MotorLevels.length; i++) {
            var level = MotorLevels[i];
            if (canHaveMuscleGradeLessThan3(exam.left.motor[level])) {
                count++;
            }
            else if (canHaveVariableMuscleGradeLessThan3(exam.left.motor[level])) {
                count++;
                variableCount++;
            }
            if (canHaveMuscleGradeLessThan3(exam.right.motor[level])) {
                count++;
            }
            else if (canHaveVariableMuscleGradeLessThan3(exam.right.motor[level])) {
                count++;
                variableCount++;
            }
            if (count - variableCount > half) {
                return {
                    result: true,
                    variable: false,
                };
            }
        }
        if (count > half && count - variableCount <= half) {
            return {
                result: true,
                variable: true,
            };
        }
    }
    return {
        result: false,
        variable: false,
    };
};
var checkASIAImpairmentScaleC = function (exam, neurologicalLevelOfInjury, canBeMotorIncompleteResult) {
    var motorFunctionC = canHaveLessThanHalfOfKeyMuscleFunctionsBelowNLIHaveMuscleGradeAtLeast3(exam, neurologicalLevelOfInjury);
    if (motorFunctionC.result) {
        if (motorFunctionC.variable || canBeMotorIncompleteResult.variable) {
            return 'C*';
        }
        else {
            return 'C';
        }
    }
};

/**
 * ```!['0', '1', '2'].includes(value)```
 */
var canHaveMuscleGradeAtLeast3 = function (value) { return !['0', '1', '2'].includes(value); };
/**
 * ```['0*', '1*', '2*', '0**', '1**', '2**'].includes(value)```
 */
var canHaveVariableMuscleGradeAtLeast3 = function (value) { return ['0*', '1*', '2*', '0**', '1**', '2**'].includes(value); };
var canHaveAtLeastHalfOfKeyMuscleFunctionsBelowNLIHaveMuscleGradeAtLeast3 = function (exam, neurologicalLevelOfInjury) {
    var result = {
        result: false,
        variable: false,
    };
    for (var _i = 0, _a = neurologicalLevelOfInjury.replace(/\*/g, '').split(','); _i < _a.length; _i++) {
        var nli = _a[_i];
        var indexOfNLI = SensoryLevels.indexOf(nli);
        var startIndex = startingMotorIndex(indexOfNLI + 1);
        var half = MotorLevels.length - startIndex;
        if (half === 0) {
            return {
                result: true,
                variable: false,
            };
        }
        var count = 0;
        var variableCount = 0;
        for (var i = startIndex; i < MotorLevels.length; i++) {
            var level = MotorLevels[i];
            count += canHaveMuscleGradeAtLeast3(exam.left.motor[level]) ? 1 : 0;
            count += canHaveMuscleGradeAtLeast3(exam.right.motor[level]) ? 1 : 0;
            variableCount += canHaveVariableMuscleGradeAtLeast3(exam.left.motor[level]) ? 1 : 0;
            variableCount += canHaveVariableMuscleGradeAtLeast3(exam.right.motor[level]) ? 1 : 0;
            if (count - variableCount >= half) {
                return {
                    result: true,
                    variable: false,
                };
            }
        }
        if (count >= half) {
            result.result = true;
            result.variable = result.variable || count - variableCount < half;
        }
    }
    return result;
};
var checkASIAImpairmentScaleD = function (exam, neurologicalLevelOfInjury, canBeMotorIncompleteResult) {
    var motorFunctionD = canHaveAtLeastHalfOfKeyMuscleFunctionsBelowNLIHaveMuscleGradeAtLeast3(exam, neurologicalLevelOfInjury);
    if (motorFunctionD.result) {
        if (motorFunctionD.variable || canBeMotorIncompleteResult.variable) {
            return 'D*';
        }
        else {
            return 'D';
        }
    }
};

var checkASIAImpairmentScaleE = function (neurologicalLevelOfInjury) {
    if (neurologicalLevelOfInjury.includes('INT*')) {
        return 'E*';
    }
    else if (neurologicalLevelOfInjury.includes('INT')) {
        return 'E';
    }
    else {
        return;
    }
};

/**
 * exam.voluntaryAnalContraction !== 'No'
 */
var motorFunctionCanBePreserved = function (exam) { return exam.voluntaryAnalContraction !== 'No'; };
var canHaveMotorFunctionMoreThanThreeLevelsBelow = function (motor, motorLevel) {
    var variable = false;
    for (var _i = 0, _a = motorLevel.split(','); _i < _a.length; _i++) {
        var m = _a[_i];
        var index = SensoryLevels.indexOf(m.replace('*', '')) + 4;
        var startingIndex = startingMotorIndex(index);
        for (var i = startingIndex; i < MotorLevels.length; i++) {
            var level = MotorLevels[i];
            if (motor[level] === '0**') {
                variable = true;
            }
            if (motor[level] !== '0') {
                return {
                    result: true,
                    variable: variable,
                };
            }
        }
    }
    return {
        result: variable,
        variable: variable,
    };
};
var canBeMotorIncomplete = function (exam, neurologicalLevels) {
    var result = {
        result: false,
        variable: false,
    };
    if (motorFunctionCanBePreserved(exam)) {
        result.result = true;
        return result;
    }
    var isSensoryPreservedResult = isSensoryPreserved(exam);
    if (isSensoryPreservedResult.result) {
        var rightMotorFunctionResult = canHaveMotorFunctionMoreThanThreeLevelsBelow(exam.right.motor, neurologicalLevels.motorRight);
        var leftMotorFunctionResult = canHaveMotorFunctionMoreThanThreeLevelsBelow(exam.left.motor, neurologicalLevels.motorLeft);
        if (rightMotorFunctionResult.result || leftMotorFunctionResult.result) {
            result.result = true;
            if (rightMotorFunctionResult.variable || leftMotorFunctionResult.variable) {
                result.variable = true;
            }
        }
    }
    return result;
};
var determineASIAImpairmentScale = function (exam, injuryComplete, neurologicalLevels, neurologicalLevelOfInjury) {
    // check isNormal because description of canBeMotorIncompleteD overlaps on canBeNormal
    if (neurologicalLevelOfInjury === 'INT') {
        return 'E';
    }
    else if (neurologicalLevelOfInjury === 'INT*') {
        return 'E*';
    }
    else {
        var possibleASIAImpairmentScales = [];
        var resultA = checkASIAImpairmentScaleA(injuryComplete);
        if (resultA) {
            possibleASIAImpairmentScales.push(resultA);
        }
        var resultB = checkASIAImpairmentScaleB(exam, neurologicalLevels);
        if (resultB) {
            possibleASIAImpairmentScales.push(resultB);
        }
        var canBeMotorIncompleteResult = canBeMotorIncomplete(exam, neurologicalLevels);
        if (canBeMotorIncompleteResult.result) {
            var resultC = checkASIAImpairmentScaleC(exam, neurologicalLevelOfInjury, canBeMotorIncompleteResult);
            if (resultC) {
                possibleASIAImpairmentScales.push(resultC);
            }
            var resultD = checkASIAImpairmentScaleD(exam, neurologicalLevelOfInjury, canBeMotorIncompleteResult);
            if (resultD) {
                possibleASIAImpairmentScales.push(resultD);
            }
        }
        var resultE = checkASIAImpairmentScaleE(neurologicalLevelOfInjury);
        if (resultE) {
            possibleASIAImpairmentScales.push(resultE);
        }
        return possibleASIAImpairmentScales.join(',');
    }
};

var classify = function (exam) {
    var neurologicalLevels = determineNeurologicalLevels(exam);
    var neurologicalLevelOfInjury = determineNeurologicalLevelOfInjury(exam);
    var injuryComplete = determineInjuryComplete(exam);
    var ASIAImpairmentScale = determineASIAImpairmentScale(exam, injuryComplete, neurologicalLevels, neurologicalLevelOfInjury);
    var zoneOfPartialPreservations = determineZoneOfPartialPreservations(exam);
    return { neurologicalLevels: neurologicalLevels, neurologicalLevelOfInjury: neurologicalLevelOfInjury, injuryComplete: injuryComplete, ASIAImpairmentScale: ASIAImpairmentScale, zoneOfPartialPreservations: zoneOfPartialPreservations };
};

var NOT_DETERMINABLE = 'ND';
var addValues = function () {
    var values = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        values[_i] = arguments[_i];
    }
    if (values.includes(NaN)) {
        throw values[values.indexOf(NaN)] + " is not a valid value";
    }
    var sum = values.reduce(function (sum, v) { return sum += v; }, 0);
    return sum.toString();
};
var calculateMotorTotal = function (motor, option) {
    var values;
    if (option === 'all') {
        values = Object.values(motor);
    }
    else if (option === 'upper') {
        values = [motor.C5, motor.C6, motor.C7, motor.C8, motor.T1];
    }
    else if (option === 'lower') {
        values = [motor.L2, motor.L3, motor.L4, motor.L5, motor.S1];
    }
    if (!values) {
        throw "option should be one of 'all' | 'upper' | 'lower'";
    }
    if (values.some(function (v) { return ['NT', '0*', '1*', '2*', '3*', 'NT*'].includes(v); })) {
        return NOT_DETERMINABLE;
    }
    else {
        var variableTotals_1 = ['0**', '1**', '2**', '3**', '4**', 'NT**'];
        var total = addValues.apply(void 0, values.map(function (v) {
            return variableTotals_1.includes(v) ? 5 : parseInt(v.replace(/\*/g, ''));
        }));
        return total + (values.some(function (v) { return variableTotals_1.includes(v); }) ? '*' : '');
    }
};
var calculateSensoryTotal = function (sensory) {
    var values = Object.values(sensory);
    if (values.some(function (v) { return ['NT', '0*', 'NT*'].includes(v); })) {
        return NOT_DETERMINABLE;
    }
    else {
        var variableTotals_2 = ['0**', '1**', 'NT**'];
        var total = addValues.apply(void 0, values.map(function (v) {
            return variableTotals_2.includes(v) ? 2 : parseInt(v.replace(/\*/g, ''));
        }));
        return total + (values.some(function (v) { return variableTotals_2.includes(v); }) ? '*' : '');
    }
};
var addTotals = function () {
    var values = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        values[_i] = arguments[_i];
    }
    if (values.includes(NOT_DETERMINABLE)) {
        return NOT_DETERMINABLE;
    }
    else {
        var total = addValues.apply(void 0, values.map(function (v) { return parseInt(v.replace(/\*/g, '')); }));
        return total + (values.some(function (v) { return v.includes('*'); }) ? '*' : '');
    }
};
var calculateSideTotals = function (side) {
    var motor = calculateMotorTotal(side.motor, 'all');
    var upperExtremity = calculateMotorTotal(side.motor, 'upper');
    var lowerExtremity = calculateMotorTotal(side.motor, 'lower');
    var lightTouch = calculateSensoryTotal(side.lightTouch);
    var pinPrick = calculateSensoryTotal(side.pinPrick);
    return { upperExtremity: upperExtremity, lowerExtremity: lowerExtremity, lightTouch: lightTouch, pinPrick: pinPrick, motor: motor };
};
var calculateTotals = function (exam) {
    var left = calculateSideTotals(exam.left);
    var right = calculateSideTotals(exam.right);
    var upperExtremity = addTotals(right.upperExtremity, left.upperExtremity);
    var lowerExtremity = addTotals(right.lowerExtremity, left.lowerExtremity);
    var lightTouch = addTotals(right.lightTouch, left.lightTouch);
    var pinPrick = addTotals(right.pinPrick, left.pinPrick);
    return {
        left: left,
        right: right,
        upperExtremity: upperExtremity,
        lowerExtremity: lowerExtremity,
        lightTouch: lightTouch,
        pinPrick: pinPrick,
    };
};

var ISNCSCI = /** @class */ (function () {
    function ISNCSCI(exam) {
        this.classification = classify(exam);
        this.totals = calculateTotals(exam);
    }
    return ISNCSCI;
}());

exports.ISNCSCI = ISNCSCI;
//# sourceMappingURL=ISNCSCI.js.map
