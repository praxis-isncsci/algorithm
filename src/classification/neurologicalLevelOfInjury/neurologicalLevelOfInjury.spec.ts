import { checkLevelWithoutMotor } from './neurologicalLevelOfInjury';

describe('neurologicalLevelOfInjury', () => {
  // 16 tests
  describe('checkLevelWithoutMotor', () => {
    const level = 'C2';
    // 3 tests
    describe(`don't continue without level`, () => {
      const tests = [
        {
          left: {continue: false, variable: false},
          right: {continue: false, variable: false},
        },
        {
          left: {continue: false, variable: false},
          right: {continue: true, variable: false},
        },
        {
          left: {continue: true, variable: false},
          right: {continue: false, variable: false},
        },
      ];

      for (const t of tests) {
        it(`left.continue: ${t.left.continue}; right.continue: ${t.right.continue}`, () => {
          // TODO remove hard coded variable
          const result = checkLevelWithoutMotor(level, t.left, t.right, false);
          expect(result.continue).toBe(false);
          expect(result.level).toBeUndefined();
        })
      }
    })

    // 9 tests
    describe(`don't continue with level`, () => {
      const tests = [
        {
          left: {'continue': false, level, variable: false},
          right: {'continue': false, variable: false},
        },
        {
          left: {'continue': false, variable: false},
          right: {'continue': false, level, variable: false},
        },
        {
          left: {'continue': false, level, variable: false},
          right: {'continue': false, level, variable: false},
        },
        {
          left: {'continue': false, level, variable: false},
          right: {'continue': true, variable: false},
        },
        {
          left: {'continue': false, variable: false},
          right: {'continue': true, level, variable: false},
        },
        {
          left: {'continue': false, level, variable: false},
          right: {'continue': true, level, variable: false},
        },
        {
          left: {'continue': true, level, variable: false},
          right: {'continue': false, variable: false},
        },
        {
          left: {'continue': true, variable: false},
          right: {'continue': false, level, variable: false},
        },
        {
          left: {'continue': true, level, variable: false},
          right: {'continue': false, level, variable: false},
        },
      ];

      for (const t of tests) {
        it(`left.continue: ${t.left.continue};${t.left.level ? ' left.level;' : ''} right.continue: ${t.right.continue};${t.right.level ? ' right.level' : ''}`, () => {
          const result = checkLevelWithoutMotor(level, t.left, t.right, false);
          expect(result.continue).toBe(false);
          expect(result.level).toBe(level);
        })
      }
    })

    // 3 tests
    describe(`continue with level`, () => {
      const tests = [
        {
          left: {'continue': true, level, variable: false},
          right: {'continue': true, variable: false},
        },
        {
          left: {'continue': true, variable: false},
          right: {'continue': true, level, variable: false},
        },
        {
          left: {'continue': true, level, variable: false},
          right: {'continue': true, level, variable: false},
        },
      ];

      for (const t of tests) {
        it(`left.continue: ${t.left.continue};${t.left.level ? ' left.level;' : ''} right.continue: ${t.right.continue};${t.right.level ? ' right.level' : ''}`, () => {
          const result = checkLevelWithoutMotor(level, t.left, t.right, false);
          expect(result.continue).toBe(true);
          expect(result.level).toBe(level);
        })
      }
    })

    // 1 test
    describe(`continue without level`, () => {
      const tests = [
        {
          left: {'continue': true, variable: false},
          right: {'continue': true, variable: false},
        },
      ];

      for (const t of tests) {
        it(`left.continue: ${t.left.continue}; right.continue: ${t.right.continue}`, () => {
          const result = checkLevelWithoutMotor(level, t.left, t.right, false);
          expect(result.continue).toBe(true);
          expect(result.level).toBeUndefined();
        })
      }
    })
  })

  //
  describe('checkLevelWithMotor', () => {
    it('TODO add tests', expect(undefined).toBeDefined)
  })
})
