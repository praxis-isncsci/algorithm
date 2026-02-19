export default {
  motorZPPCheckIfMotorZPPIsApplicableDescription:
    'Check if there is voluntary anal contraction (VAC)',
  motorZPPCheckIfMotorZPPIsApplicableYesAction:
    'VAC is set to "Yes". We set the Motor ZPP to "NA" and stop',
  motorZPPCheckIfMotorZPPIsApplicableNTAction:
    'VAC is set to "NT". We set the Motor ZPP to "NA" and we proceed to determine the Top and Bottom levels.',
  motorZPPCheckIfMotorZPPIsApplicableNoAction:
    'VAC is set to "No". We proceed to determine the Top and Bottom levels.',
  motorZPPCheckLowerNonKeyMuscleDescription:
    'Check for motor function on the lowest non-key muscle.',
  motorZPPCheckLowerNonKeyMuscleConsiderAction:
    'Consider non-key muscle with motor function when calculating the Motor ZPP',
  motorZPPCheckLowerNonKeyMuscleDoNotConsiderAction:
    'The lowest non-key muscle does not have an effect on the AIS calculation on this side.',
  motorZPPGetTopAndBottomLevelsForCheckDescription:
    'Using the Motor Levels, look for the top and bottom levels to examine. We will move from bottom to top using that range.',
  motorZPPGetTopAndBottomLevelsForCheckRangeAction:
    'Our search range will be between {{bottom}} (bottom) and {{top}} (top).',
  motorZPPGetTopAndBottomLevelsForCheckIncludeBelowS1Action:
    'Since there are motor levels below S1, the bottom of our range is determined by the lowest Motor Level.',
  motorZPPGetTopAndBottomLevelsForCheckDoNotIncludeBelowS1Action:
    'Since there are no motor levels below S1, we make S1 the bottom of our range.',
  motorZPPCheckForMotorFunctionDescription:
    'Check for motor function on {{levelName}}: {{motor}}.',
  motorZPPCheckForMotorFunctionNonKeyMuscleOverrideAndStopAction:
    'Motor function was found but the lowest non-key muscle with motor function overrides it as it affects the AIS calculation for this case. We stop iterating.',
  motorZPPCheckForMotorFunctionAddLevelAndStopAction:
    'Motor function was found. We include {{levelName}} in Motor ZPP and stop iterating.',
  motorZPPCheckForMotorFunctionFunctionFoundButKeyMuscleOverrideAction:
    'Motor function marked as not normal was found but the lowest non-key muscle with motor function overrides it as it affects the AIS calculation for this case. We continue iterating.',
  motorZPPCheckForMotorFunctionStopAtTopAction:
    'Because we have reached the top level in our range, we stop.',
  motorZPPCheckForMotorFunctionContinueUntilTopAction:
    'Since we have not reached the top level of our range, we continue',
  motorZPPCheckForMotorFunctionAddStarAction:
    'Since motor has a star on this level or above, we add a star to the result.',
  motorZPPCheckForMotorFunctionAddLevelWithNormalFunctionAndContinue:
    'Motor function marked as not normal was found. We include {{levelName}} in Motor ZPP and continue.',
  motorZPPCheckForMotorFunctionNoFunctionFoundContinueAction:
    'No motor function was found. We continue.',
  motorZPPCheckForMotorFunctionTopOfRangeReachedStopAction:
    'We reached the top of the searchable range. We stop iterating. Next we will check the lowest non-key muscle with motor function.',
  motorZPPCheckForSensoryFunctionDescription:
    'Check for sensory function on {{levelName}} (LT: {{lightTouch}} - PP: {{pinPrick}})',
  motorZPPCheckForSensoryFunctionLevelIncludedInMotorValuesAction:
    '{{levelName}} is included in motor values.',
  motorZPPCheckForSensoryFunctionLevelIncludedButOverriddenByNonKeyMuscleAction:
    'The value, however is overridden by the non-key muscle',
  motorZPPCheckForSensoryFunctionAddLevelAndContinueAction:
    'We add {{levelName}} to Motor ZPP and continue checking.',
  motorZPPCheckForSensoryFunctionTopOfRangeReachedStopAction:
    'We are at the top of the range, we stop.',
  motorZPPCheckForSensoryFunctionNoSensoryFunctionFoundContinueAction:
    'No sensory function was found. We continue.',
  motorZPPSortMotorZPPDescription: 'Sort Motor ZPP',
  motorZPPSortMotorZPPEnsureNAIsPlacedFirstAction:
    'Ensure "NA" is placed first',
  motorZPPAddLowerNonKeyMuscleToMotorZPPIfNeededDescription:
    'If the non-key muscle affects the AIS calculations, we add it to Motor ZPP.',
  motorZPPAddLowerNonKeyMuscleToMotorZPPIfNeededAddNonKeyMuscleAction:
    'We add the lowest non-key muscle with motor function to the Motor ZPP',
  motorZPPAddLowerNonKeyMuscleToMotorZPPIfNeededIgnoreNonKeyMuscleAction:
    'The lowest non-key muscle either does not have an effect on the AIS or has already been added to Motor ZPP.',
  // Sensory ZPP
  sensoryZPPCheckIfSensoryZPPIsApplicableDescription:
    'Check if Deep Anal Pressure and S4-5 allow Sensory ZPP calculation.',
  sensoryZPPCheckIfSensoryZPPIsApplicableYesAction:
    'DAP is "Yes". Sensory ZPP is "NA".',
  sensoryZPPCheckIfSensoryZPPIsApplicableS4_5PreservedAction:
    'S4-5 has preserved sensation. Sensory ZPP is "NA".',
  sensoryZPPCheckIfSensoryZPPIsApplicableProceedAction:
    'DAP is "No" or "NT" and S4-5 sensation is absent. Proceed to evaluate sacral level.',
  sensoryZPPCheckSacralLevelDescription: 'Evaluate S4-5 sensory values.',
  sensoryZPPCheckSacralLevelAddNAAction:
    'Add "NA" to Sensory ZPP based on DAP and sacral result.',
  sensoryZPPCheckSacralLevelNoNAAction:
    'Do not add "NA". Proceed to iterate levels.',
  sensoryZPPGetTopAndBottomLevelsForCheckDescription:
    'Set search range from S3 to C1.',
  sensoryZPPGetTopAndBottomLevelsForCheckRangeAction:
    'Range: {{top}} (top) to {{bottom}} (bottom).',
  sensoryZPPCheckLevelDescription:
    'Check sensory function at {{levelName}} (LT: {{lightTouch}}, PP: {{pinPrick}}).',
  sensoryZPPCheckLevelAddLevelAction: 'Add {{levelName}} to Sensory ZPP.',
  sensoryZPPCheckLevelContinueAction: 'Continue to next level.',
  sensoryZPPCheckLevelStopAction:
    'Sensory function boundary found. Stop iteration.',
  sensoryZPPCheckLevelReachedC1Action: 'Reached C1. Add C1 and complete.',
  sensoryZPPSortSensoryZPPDescription: 'Sort Sensory ZPP.',
  sensoryZPPSortSensoryZPPEnsureNAIsPlacedFirstAction:
    'Ensure "NA" is placed first.',
  // Sensory Level
  sensoryLevelInitializeSensoryLevelIterationDescription:
    'Initialize sensory level calculation. Iterate from C1 toward S4_5.',
  sensoryLevelInitializeSensoryLevelIterationAction:
    'Set levels to empty, variable to false, and currentIndex to 0.',
  sensoryLevelCheckLevelDescription:
    'Check sensory function at {{levelName}} (LT: {{lightTouch}}, PP: {{pinPrick}}).',
  sensoryLevelCheckLevelBothNormalAction:
    'LT and PP both normal. Continue to next level.',
  sensoryLevelCheckLevelAbnormalAction:
    'Abnormal sensation at next level. Add {{levelName}} and stop.',
  sensoryLevelCheckLevelNTStarAction:
    'NT* at next level. Add {{levelName}}* and stop.',
  sensoryLevelCheckLevelNTVariableAction:
    'NT with variable sensory. Add {{levelName}} and continue.',
  sensoryLevelCheckLevelNTNotVariableAction:
    'NT with non-variable sensory. Add {{levelName}} and continue.',
  sensoryLevelCheckLevelOtherVariableAction:
    'Variable sensory at next level. Continue.',
  sensoryLevelCheckLevelReachedEndAction: 'Reached S4_5. Add {{intLevel}}.',
};
