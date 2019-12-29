import { of, interval } from 'rxjs';
import {
  concat,
  take,
  filter,
  retry,
  map,
  concatMap,
  delay,
  debounceTime,
  mapTo,
  catchError
} from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';

let testScheduler: TestScheduler;

describe('marble testing in RxJS', () => {
  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });
  /*
    ASCII marble diagrams are parsed, creating an observable that emits test message objects.
    These include the values emitted, the frame at which they were emitted, and the type 
    of notification, including next, error, and complete. This allows a deep equal to be run
    against the expected output, which is created in the same fashion by parsing the marble diagram
    supplied in the toBe clause.
    Example output: 
    {"frame":3,"notification":{"kind":"N","value":"a","hasValue":true}}
​    {"frame":7,"notification":{"kind":"N","value":"b","hasValue":true}}
​    {"frame":11,"notification":{"kind":"C","hasValue":false}}
  */
  it('should parse marble diagrams to create observables', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const source$ = cold('---a---b---|');
      const expected =     '---a---b---|';

      expectObservable(source$).toBe(expected);
    });
  });
  
  /*
    Testing expected output of combining observables.
  */
  it('should work with combine observables', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const source$ =    cold('-a---b-|');
      const sourceTwo$ = cold('-c---d-|');
      const final$ = source$.pipe(concat(sourceTwo$));
      const expected =        '-a---b--c---d-|';

      expectObservable(final$).toBe(expected);
    });
  });

  it('should let you identify subscription points', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable, expectSubscriptions } = helpers;
      const source$ =    cold('-a---b-|');
      const sourceTwo$ = cold('-c---d-|');
      const final$ = source$.pipe(concat(sourceTwo$));

      const expected =        '-a---b--c---d-|';
      const sub1 =            '^------!';
      const sub2 =            '-------^------!';

      expectObservable(final$).toBe(expected);
      expectSubscriptions(source$.subscriptions).toBe(sub1);
      expectSubscriptions(sourceTwo$.subscriptions).toBe(sub2);
    });
  });

  /*
    When testing hot observables you can specify the subscription
    point using a caret ^, similar to how you specify subscriptions
    when utilizing the expectSubscriptions assertion.
  */
  it('should work with hot observables', () => {
    testScheduler.run(helpers => {
      const { expectObservable, hot } = helpers;
      const source$ =    hot('---a--^-b-|');
      const expected =             '--b-|';

      expectObservable(source$).toBe(expected);
    });
  });

  /*
    Both the hot and cold methods, as well the the toBe method accept an object map as a
    second parameter, indicating the values to output for the appropriate placeholder.
    When the test is executed these values rather than the matching string in the marble diagram.
  */
  it('should correctly sub in values', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const values = { a: 1, b: 2 };
      const source$ = cold('---a---b---|', values);
      const expected =     '---a---b---|';

      expectObservable(source$).toBe(expected, values);
    });
  });

  /*
    Multiple emissions occuring in same time frame can be represented by grouping in parenthesis.
    Complete and error symbols can also be included in the same grouping as simulated outputs.
  */
  it('should handle emissions in the same time frame', () => {
    testScheduler.run(helpers => {
      const { expectObservable } = helpers;
      const source$ = of(1, 2, 3);
      const expected = '(abc|)';

      expectObservable(source$).toBe(expected, { a: 1, b: 2, c: 3 });
    });
  });

  /*
   * Async operators such as delay automatically utilize the
   * test scheduuler when inside the run method. Even though
   * the tests run synchronously we can specify the time it
   * would normally take in assertions in ms, for instance
   * delay will delay the emission of all 3 values by 10ms.
   */
  it('should handle asynchronous operations', () => {
    testScheduler.run(helpers => {
      const { expectObservable } = helpers;
      const source$ = of(1, 2, 3).pipe(delay(10));
      const expected = '10ms (abc|)';

      expectObservable(source$).toBe(expected, { a: 1, b: 2, c: 3 });
    });
  });
  /*
   * In this case since concat is used each inner observable will
   * be subscribed to when the previous completes. The emitted value
   * itself accounts for 1ms when we write our expected output,
   * so after the initial delay instead of 1s it will be 999ms.
   */
  it('should handle asynchronous operations - part2', () => {
    testScheduler.run(helpers => {
      const { expectObservable } = helpers;
      const source$ = of(1, 2, 3);
      const final$ = source$.pipe(
        concatMap(v => {
          return of(v + 10).pipe(delay(1000));
        })
      );
      const expected = '1s a 999ms b 999ms (c|)';

      expectObservable(final$).toBe(expected, { a: 11, b: 12, c: 13 });
    }); 
  });

  it('should work with rate limiting operators', () => {
    testScheduler.run(helpers => {
      const { expectObservable, cold } = helpers;
      const source$ = cold('ab--c-d--|');
      const final$ = source$.pipe(
        debounceTime(2)
      );
      const expected = '3ms b 4ms d|';

      expectObservable(final$).toBe(expected);
    });
  });
  /*
   *  When testing streams that do not explicitly complete
   *  we can pass when to complete the stream as the second 
   *  argument to the 'expectObservable' function.
   */
  it('should let you test streams that do not complete', () => {
    testScheduler.run(({ expectObservable }) => {
      const source$ = interval(1000).pipe(map(val => val + 10));
      const expected = '1s a 999ms b 999ms c'
      const unsubscribe = '4000ms !';
   
      expectObservable(source$, unsubscribe).toBe(expected, {
        a: 10, b: 11, c: 12
      });
    });
  })
  /*
   *  Errors are represented by the '#' sign, and error messages
   *  can be provided as the third argument to the 'toBe' method.
   */
  it('should let you test errors and error messages', () => {
    testScheduler.run(helpers => {
      const { expectObservable } = helpers;
      const source$ = of({ first: 'Brian', last: 'Smith' }, null).pipe(
        map(o => `${o.first} ${o.last}`),
        catchError(() => {
          throw 'Invalid response!'
        })
      );

      const expected = '(a#)';
      expectObservable(source$).toBe(
        expected,
        { a: 'Brian Smith' },
        'Invalid response!'
      );
    });
  });
});
