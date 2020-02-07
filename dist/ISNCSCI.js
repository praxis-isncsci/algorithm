var ISNCSCI = (function (exports) {
  'use strict';

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

  var isAbnormalSensory = function (value) { return ['0', '1', '0*', '1*', 'NT*'].includes(value); };
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
      // const nextLevelContainsNT = side.pinPrick[nextLevel] === 'NT' || side.lightTouch[nextLevel] === 'NT';
      // const nextLevelContainsAbnormal = isAbnormalSensory(side.pinPrick[nextLevel]) || isAbnormalSensory(side.lightTouch[nextLevel]);
      // if (nextLevelContainsNT && !nextLevelContainsAbnormal) {
      //   return {continue: true, level: level + (variable ? '*' : '')};
      // } else {
      //   const nextLevelPinPrickConsideredAbnormal = variableSensory(side.pinPrick[nextLevel]);
      //   const nextLevelLightTouchConsideredAbnormal = variableSensory(side.lightTouch[nextLevel]);
      //   const bothConsideredAbnormal = nextLevelPinPrickConsideredAbnormal && nextLevelLightTouchConsideredAbnormal;
      //   const oneNormalAndOneConsideredAbnormal = (nextLevelPinPrickConsideredAbnormal || nextLevelLightTouchConsideredAbnormal) &&
      //     (nextLevelPinPrickIsNormal || nextLevelLightTouchIsNormal);
      //   const oneNotTestableAndOneConsideredAbnormal = (nextLevelPinPrickConsideredAbnormal || nextLevelLightTouchConsideredAbnormal) &&
      //     nextLevelContainsNT;
      //   if (bothConsideredAbnormal || oneNormalAndOneConsideredAbnormal || oneNotTestableAndOneConsideredAbnormal) {
      //     return {continue: false, level: level + '*'};
      //   } else {
      //     return {continue: false, level: level + (variable ? '*' : '')};
      //   }
      // }
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
      return result;
  };
  var checkMotorLevelBeforeStartOfKeyMuscles = function (side, level, nextLevel, variable) {
      return {
          "continue": !['0', '1', '2'].includes(side.motor[nextLevel]),
          level: ['0', '1', '2', '0*', '1*', '2*', 'NT', 'NT*'].includes(side.motor[nextLevel]) ? level + (variable ? '*' : '') : undefined,
          variable: variable,
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
      if (side.motor[level] !== 'NT' &&
          (['3', '4', '0*', '1*', '2*', '3*', '4*', 'NT*'].includes(side.motor[level]) || !sensoryCheckLevelResult["continue"])) {
          result["continue"] = false;
      }
      if (!(['5', '0**', '1**', '2**', '3**', '4**', 'NT**'].includes(side.motor[level]) && sensoryCheckLevelResult["continue"] && !sensoryCheckLevelResult.level)) {
          if (['0*', '1*', '2*', 'NT*'].includes(side.motor[level]) ||
              (['0**', '1**', '2**'].includes(side.motor[level]) &&
                  (sensoryCheckLevelResult.level || !sensoryCheckLevelResult["continue"]))) {
              result.level = level + '*';
          }
          else {
              result.level = level + (variable ? '*' : '');
          }
      }
      if (['0*', '1*', '2*', 'NT*', '0**', '1**', '2**'].includes(side.motor[level]) || (['3**', '4**', 'NT**'].includes(side.motor[level]) && sensoryCheckLevelResult["continue"]) || (side.motor[level] === '5' &&
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
  var checkLevelForSensoryZPP = function (side, level) {
      if (level === 'C1') {
          throw "invalid argument level: " + level;
      }
      var currentLevelPinPrickIsAbsent = isAbsentSensory(side.pinPrick[level]);
      var currentLevelLightTouchIsAbsent = isAbsentSensory(side.lightTouch[level]);
      if (currentLevelPinPrickIsAbsent && currentLevelLightTouchIsAbsent) {
          // TODO: remove hard coded variable
          return { "continue": true, variable: false };
      }
      if (!canBeAbsentSensory(side.pinPrick[level]) || !canBeAbsentSensory(side.lightTouch[level])) {
          // TODO: remove hard coded variable
          return { "continue": false, level: level, variable: false };
      }
      else {
          // TODO: remove hard coded variable
          return { "continue": true, level: level, variable: false };
      }
  };
  var determineSensoryZPP = function (side, deepAnalPressure) {
      var zpp = [];
      if ((deepAnalPressure === 'No' || deepAnalPressure === 'NT') && canBeAbsentSensory(side.lightTouch.S4_5) && canBeAbsentSensory(side.pinPrick.S4_5)) {
          var sacralResult = checkLevelForSensoryZPP(side, 'S4_5');
          if (deepAnalPressure === 'NT' ||
              (deepAnalPressure === 'No' && (!sacralResult["continue"] || sacralResult.level !== undefined))) {
              zpp.push('NA');
          }
          var levels = [];
          for (var i = SensoryLevels.indexOf('S3'); i >= 0; i--) {
              var level = SensoryLevels[i];
              var nextLevel = SensoryLevels[i - 1];
              if (nextLevel) {
                  var result = checkLevelForSensoryZPP(side, level);
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

  var canBeTotalParalysisMotor = function (value) { return ['NT', '0*', 'NT*'].includes(value); };
  var canBeNormalMotor = function (value) { return ['5', 'NT', '0**', '1**', '2**', '3**', '4**', 'NT**'].includes(value); };
  var canBeNormalSensory = function (value) { return ['2', 'NT', '0**', '1**', 'NT**'].includes(value); };
  var checkLevelForMotorZPP = function (side, level) {
      if (side.motor[level] === '0') {
          // TODO: remove hard coded variable
          return { "continue": true, variable: false };
      }
      if (canBeTotalParalysisMotor(side.motor[level])) {
          // TODO: remove hard coded variable
          return { "continue": true, level: level, variable: false };
      }
      // TODO: remove hard coded variable
      return { "continue": false, level: level, variable: false };
  };
  var checkLevelForMotorZPPOnSensory = function (side, level) {
      if (level === 'C1') {
          throw "invalid argument level: " + level;
      }
      var canBeNormalLightTouch = canBeNormalSensory(side.lightTouch[level]);
      var canBeNormalPinPrick = canBeNormalSensory(side.pinPrick[level]);
      if (canBeNormalLightTouch && canBeNormalPinPrick) {
          if (side.lightTouch[level] === 'NT' || side.pinPrick[level] === 'NT') {
              // TODO: remove hard coded variable
              return { "continue": true, level: level, variable: false };
          }
          else {
              // TODO: remove hard coded variable
              return { "continue": false, level: level, variable: false };
          }
      }
      else {
          // TODO: remove hard coded variable
          return { "continue": true, variable: false };
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
          var canAllBeNormalDownTo = 'S4_5';
          for (var i = SensoryLevels.indexOf('C2'); i < SensoryLevels.length; i++) {
              if (levelIsBetween(i, 'C5', 'T1') || levelIsBetween(i, 'L2', 'S1')) {
                  var index = i - (levelIsBetween(i, 'C5', 'T1') ? 4 : 16);
                  var level_1 = MotorLevels[index];
                  if (!canBeNormalMotor(side.motor[level_1])) {
                      canAllBeNormalDownTo = SensoryLevels[i - 1];
                      break;
                  }
                  if (!canBeNormalSensory(side.lightTouch[level_1]) || !canBeNormalSensory(side.pinPrick[level_1])) {
                      canAllBeNormalDownTo = SensoryLevels[i - 1];
                      break;
                  }
              }
              else {
                  var level_2 = SensoryLevels[i];
                  if (level_2 === 'C1') {
                      throw "invalid argument level: " + level_2;
                  }
                  if (!canBeNormalSensory(side.lightTouch[level_2]) || !canBeNormalSensory(side.pinPrick[level_2])) {
                      canAllBeNormalDownTo = SensoryLevels[i - 1];
                      break;
                  }
              }
          }
          var levels = [];
          var level = void 0;
          // TODO: remove hard coded variable
          var result = { "continue": true, variable: false };
          if (voluntaryAnalContraction === 'NT' ||
              (voluntaryAnalContraction === 'No' && canAllBeNormalDownTo === 'S4_5')) {
              zpp.push('NA');
              result = checkLevelForMotorZPPOnSensory(side, 'S4_5');
          }
          // start iteration from bottom
          for (var i = SensoryLevels.indexOf('S3'); i >= 0; i--) {
              if (!result["continue"]) {
                  break;
              }
              level = SensoryLevels[i];
              // check sensory
              if (levelIsBetween(i, 'C2', 'C4') || levelIsBetween(i, 'T2', 'L1') || levelIsBetween(i, 'S2', 'S3')) {
                  if (levelIsBetween(i, 'C2', canAllBeNormalDownTo)) {
                      result = checkLevelForMotorZPPOnSensory(side, level);
                  }
                  else {
                      // TODO: remove hard coded variable
                      result = { "continue": true, variable: false };
                  }
              }
              // check motor
              else if (levelIsBetween(i, 'C5', 'T1') || levelIsBetween(i, 'L2', 'S1')) {
                  // level = C5 to C8
                  var index = i - (levelIsBetween(i, 'C5', 'T1') ? 4 : 16);
                  level = MotorLevels[index];
                  result = checkLevelForMotorZPP(side, level);
              }
              // level = C1
              else {
                  // TODO: remove hard coded variable
                  result = { "continue": false, level: 'C1', variable: false };
              }
              if (result.level) {
                  levels.unshift(result.level);
              }
          }
          if (side.lowestNonKeyMuscleWithMotorFunction &&
              checkLowestNonKeyMuscleWithMotorFunction(levels, side.lowestNonKeyMuscleWithMotorFunction)) {
              return side.lowestNonKeyMuscleWithMotorFunction;
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
                  checkMotorLevelAtEndOfKeyMuscles(exam.left, level, variable) :
                  checkMotorLevel(exam.left, motorLevel, nextMotorLevel, variable);
          var rightMotorResult = level === 'C4' || level === 'L1' ?
              checkMotorLevelBeforeStartOfKeyMuscles(exam.left, level, nextMotorLevel, variable) :
              level === 'T1' || level === 'S1' ?
                  checkMotorLevelAtEndOfKeyMuscles(exam.right, level, variable) :
                  checkMotorLevel(exam.right, motorLevel, nextMotorLevel, variable);
          var resultLevel = void 0;
          if (leftMotorResult.level || rightMotorResult.level) {
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
          var result = void 0;
          if (!nextLevel) {
              listOfNLI.push('INT');
          }
          else {
              // TODO remove hard coded variable
              var leftSensoryResult = checkSensoryLevel(exam.left, level, nextLevel, false);
              var rightSensoryResult = checkSensoryLevel(exam.right, level, nextLevel, false);
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
                  return 'C,I*';
              }
          }
          else {
              if ([
                  exam.right.lightTouch.S4_5,
                  exam.right.pinPrick.S4_5,
                  exam.left.lightTouch.S4_5,
                  exam.left.pinPrick.S4_5
              ].every(function (v) { return ['0', '0*'].includes(v); }) && ![
                  exam.right.lightTouch.S4_5,
                  exam.right.pinPrick.S4_5,
                  exam.left.lightTouch.S4_5,
                  exam.left.pinPrick.S4_5
              ].every(function (v) { return v == '0'; })) {
                  return 'C*,I';
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
  var canBeNoPreservedMotor = function (value) { return !['0', 'NT', 'NT*', '0*'].includes(value); };
  var canBePreservedMotor = function (value) { return value !== '0'; };
  var isSensoryPreserved = function (exam) {
      return exam.deepAnalPressure !== 'No' ||
          exam.right.lightTouch.S4_5 !== '0' || exam.right.pinPrick.S4_5 !== '0' ||
          exam.left.lightTouch.S4_5 !== '0' || exam.left.pinPrick.S4_5 !== '0';
  };
  var canHaveNoMotorFunctionMoreThanThreeLevelsBelow = function (motor, motorLevel) {
      for (var _i = 0, _a = motorLevel.split(','); _i < _a.length; _i++) {
          var m = _a[_i];
          var index = SensoryLevels.indexOf(m.replace('*', '')) + 4;
          var startingIndex = startingMotorIndex(index);
          var thereCanBeNoMotorFunction = true;
          for (var i = startingIndex; i < MotorLevels.length; i++) {
              var level = MotorLevels[i];
              if (canBeNoPreservedMotor(motor[level])) {
                  thereCanBeNoMotorFunction = false;
                  break;
              }
          }
          if (thereCanBeNoMotorFunction) {
              return true;
          }
      }
      return false;
  };
  var motorCanBeNotPreserved = function (exam, neurologicalLevels) {
      return exam.voluntaryAnalContraction !== 'Yes' &&
          canHaveNoMotorFunctionMoreThanThreeLevelsBelow(exam.right.motor, neurologicalLevels.motorRight) &&
          canHaveNoMotorFunctionMoreThanThreeLevelsBelow(exam.left.motor, neurologicalLevels.motorLeft);
  };
  var canBeInjuryComplete = function (injuryComplete) { return injuryComplete === 'C' || injuryComplete === 'C,I'; };
  /**
   * Check AIS can be B i.e. Is injury Motor Complete?
   */
  var canBeSensoryIncomplete = function (exam, neurologicalLevels) {
      return isSensoryPreserved(exam) && motorCanBeNotPreserved(exam, neurologicalLevels);
  };
  /**
   * exam.voluntaryAnalContraction !== 'No'
   */
  var motorFunctionCanBePreserved = function (exam) { return exam.voluntaryAnalContraction !== 'No'; };
  var canHaveMuscleGradeLessThan3 = function (value) { return ['0', '1', '2', '0*', '1*', '2*', 'NT', 'NT*'].includes(value); };
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
          for (var i = startIndex; i < MotorLevels.length; i++) {
              var level = MotorLevels[i];
              count += canHaveMuscleGradeLessThan3(exam.left.motor[level]) ? 1 : 0;
              count += canHaveMuscleGradeLessThan3(exam.right.motor[level]) ? 1 : 0;
              if (count > half) {
                  return true;
              }
          }
      }
      return false;
  };
  var canHaveMotorFunctionMoreThanThreeLevelsBelow = function (motor, motorLevel) {
      for (var _i = 0, _a = motorLevel.split(','); _i < _a.length; _i++) {
          var m = _a[_i];
          var index = SensoryLevels.indexOf(m.replace('*', '')) + 4;
          var startingIndex = startingMotorIndex(index);
          for (var i = startingIndex; i < MotorLevels.length; i++) {
              var level = MotorLevels[i];
              if (canBePreservedMotor(motor[level])) {
                  return true;
              }
          }
      }
      return false;
  };
  var canBeMotorIncomplete = function (exam, neurologicalLevels) {
      return (motorFunctionCanBePreserved(exam) || (isSensoryPreserved(exam) && (canHaveMotorFunctionMoreThanThreeLevelsBelow(exam.right.motor, neurologicalLevels.motorRight) ||
          canHaveMotorFunctionMoreThanThreeLevelsBelow(exam.left.motor, neurologicalLevels.motorLeft))));
  };
  var canHaveMuscleGradeAtLeast3 = function (value) { return !['0', '1', '2'].includes(value); };
  var canHaveAtLeastHalfOfKeyMuscleFunctionsBelowNLIHaveMuscleGradeAtLeast3 = function (exam, neurologicalLevelOfInjury) {
      for (var _i = 0, _a = neurologicalLevelOfInjury.replace(/\*/g, '').split(','); _i < _a.length; _i++) {
          var nli = _a[_i];
          var indexOfNLI = SensoryLevels.indexOf(nli);
          var startIndex = startingMotorIndex(indexOfNLI + 1);
          var half = MotorLevels.length - startIndex;
          if (half === 0) {
              return true;
          }
          var count = 0;
          for (var i = startIndex; i < MotorLevels.length; i++) {
              var level = MotorLevels[i];
              count += canHaveMuscleGradeAtLeast3(exam.left.motor[level]) ? 1 : 0;
              count += canHaveMuscleGradeAtLeast3(exam.right.motor[level]) ? 1 : 0;
              if (count >= half) {
                  return true;
              }
          }
      }
      return false;
  };
  var canBeNormal = function (neurologicalLevels) {
      return neurologicalLevels.motorLeft.includes('INT') &&
          neurologicalLevels.motorRight.includes('INT') &&
          neurologicalLevels.sensoryLeft.includes('INT') &&
          neurologicalLevels.sensoryRight.includes('INT');
  };
  var isNormal = function (neurologicalLevelOfInjury) {
      return neurologicalLevelOfInjury === 'INT' || neurologicalLevelOfInjury === 'INT*';
  };
  var determineASIAImpairmentScale = function (exam, injuryComplete, neurologicalLevels, neurologicalLevelOfInjury) {
      // check isNormal because description of canBeMotorIncompleteD overlaps on canBeNormal
      if (isNormal(neurologicalLevelOfInjury)) {
          return 'E';
      }
      else {
          var possibleASIAImpairmentScales = [];
          if (canBeInjuryComplete(injuryComplete)) {
              possibleASIAImpairmentScales.push('A');
          }
          if (canBeSensoryIncomplete(exam, neurologicalLevels)) {
              possibleASIAImpairmentScales.push('B');
          }
          if (canBeMotorIncomplete(exam, neurologicalLevels)) {
              if (canHaveLessThanHalfOfKeyMuscleFunctionsBelowNLIHaveMuscleGradeAtLeast3(exam, neurologicalLevelOfInjury)) {
                  possibleASIAImpairmentScales.push('C');
              }
              if (canHaveAtLeastHalfOfKeyMuscleFunctionsBelowNLIHaveMuscleGradeAtLeast3(exam, neurologicalLevelOfInjury)) {
                  possibleASIAImpairmentScales.push('D');
              }
          }
          if (canBeNormal(neurologicalLevels)) {
              possibleASIAImpairmentScales.push('E');
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
  var NOT_DETERMINABLE_STAR = 'ND*';
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
      if (values.some(function (v) { return ['0*', '1*', '2*', '3*', 'NT*'].includes(v); })) {
          return NOT_DETERMINABLE_STAR;
      }
      else if (values.some(function (v) { return 'NT' === v; })) {
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
      if (values.some(function (v) { return ['0*', 'NT*'].includes(v); })) {
          return NOT_DETERMINABLE_STAR;
      }
      else if (values.some(function (v) { return 'NT' === v; })) {
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
      if (values.includes(NOT_DETERMINABLE_STAR)) {
          return NOT_DETERMINABLE_STAR;
      }
      else if (values.includes(NOT_DETERMINABLE)) {
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

  return exports;

}({}));
//# sourceMappingURL=ISNCSCI.js.map
