import { of } from 'rxjs';
import {
  toArray,
  delay,
  map
} from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';

let testScheduler: TestScheduler;

describe('subscribe / assert testing in RxJS', () => {
  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });
  /*
   *  With subscribe / assert pattern we do not use the 
   *  expectObservable helper function. Instead we simply
   *  subscribe and use our test frameworks built in assertions.
   *  In order to confirm streams that emit multiple values, one
   *  method is to update an index and assert on each emitted value.
   */
  it('should compare each emitted value', () => {
    let index = 0;
    const source$ = of(1, 2, 3);
    const final$ = source$.pipe(map(val => val * 10));
    const expected = [10, 20, 30];

    final$.subscribe(result => {
      expect(result).toEqual(expected[index]);
      index++;
    });
  });

  /*
   *  We could also use the toArray operator which emits all
   *  emitted values as an array on completion, then compare
   *  the arrays as a whole.
   */
  it('should compare total emitted values', () => {
    const source$ = of(1, 2, 3);
    const final$ = source$.pipe(map(val => val * 10));
    const expected = [10, 20, 30];

    final$.pipe(toArray()).subscribe(result => {
      expect(result).toEqual(expected);
    });
  });

  /*
   *  For async testing we must remember to call done() to signal
   *  when our test is complete.
   */
  it('should compare total emitted values async - done', done => {
    const source$ = of(1, 2, 3);
    const expected = [1, 2, 3];

    source$.pipe(delay(10), toArray()).subscribe(result => {
      expect(result).toEqual(expected);
      done();
    });
  });

  /*
   *  We could also use testScheduler.run to make our async
   *  operators synchronous. Unfortunately with subscribe / assert
   *  there is no great way to confirm time in our assertions, only
   *  that the final emitted values match. This is one downside vs
   *  testing with marble diagrams, as seen in the previous section.
   */
  it('should compare each emitted value async - testScheduler', () => {
    testScheduler.run(helpers => {
      let index = 0;
      const source$ = of(1, 2, 3);
      const expected = [1, 2, 3];

      source$.pipe(delay(10)).subscribe(val => {
        expect(val).toEqual(expected[index]);
        index++;
      });
    });
  });

  it('should let you test errors and error messages', () => {
      const source$ = of(1, 2, 3).pipe(
        map(val => {
          if (val > 2) {
            throw 'Number too high!';
          }
          return val;
        })
      );

      source$.subscribe({
        error: err => {
          expect(err).toBe('Number too high!');
        }
      });
  });
});
