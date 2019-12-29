import { of } from 'rxjs';
import { toArray, delay, map, catchError } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';

describe('subscribe / assert testing in RxJS', () => {
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

    source$.pipe(delay(100), toArray()).subscribe(result => {
      expect(result).toEqual(expected);
      done();
    });
  });

  /*
   *  We could also supply the test scheduler to make our async
   *  operators synchronous. Unfortunately with subscribe / assert
   *  there is no great way to confirm time in our assertions, only
   *  that the final emitted values match. This is one downside vs
   *  testing with marble diagrams, as seen in the previous section.
   *  However, with this approach our test will execute synchronously, where
   *  with the previous approach it would cost 100ms on the delay.
   */
  it('should compare each emitted value async - testScheduler', () => {
    const scheduler = new TestScheduler(() => {});
    const source$ = of(1, 2, 3);
    const expected = [1, 2, 3];

    source$.pipe(delay(100, scheduler), toArray()).subscribe(result => {
      expect(result).toEqual(expected);
    });

    scheduler.flush();
  });

  it('should let you test errors and error messages', () => {
    const source$ = of({ first: 'Brian', last: 'Smith' }, null).pipe(
      map(o => `${o.first} ${o.last}`),
      catchError(() => {
        throw 'Invalid response!';
      })
    );

    source$.subscribe({
      next: name => {
        expect(name).toBe('Brian Smith');
      },
      error: err => {
        expect(err).toBe('Invalid response!');
      }
    });
  });
});
