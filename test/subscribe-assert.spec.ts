import { of } from 'rxjs';
import { toArray, delay, map, catchError, mergeMap } from 'rxjs/operators';
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
    const source$ = of('Ready', 'Set', 'Go!').pipe(
      mergeMap((message, index) => of(message).pipe(delay(index * 1000)))
    );

    const expected = ['Ready', 'Set', 'Go!'];
    let index = 0;

    source$.subscribe(
      message => {
        expect(message).toEqual(expected[index]);
        index++;
      },
      null,
      done
    );
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
