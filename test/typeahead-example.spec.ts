// @ts-nocheck
import { EMPTY, Observable, of, throwError } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import {
  debounceTime,
  pluck,
  distinctUntilChanged,
  switchMap,
  catchError,
  delay
} from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';

const BASE_URL = 'https://api.openbrewerydb.org/breweries';

export const breweryTypeahead = (ajaxHelper = ajax) => (
  observable: Observable<any>
) => {
  return observable.pipe(
    debounceTime(200),
    pluck('target', 'value'),
    distinctUntilChanged(),
    switchMap(searchTerm =>
      ajaxHelper
        .getJSON(`${BASE_URL}?by_name=${searchTerm}`)
        .pipe(catchError(() => EMPTY))
    )
  );
};

let testScheduler: TestScheduler;

describe('The brewery typehead', () => {
  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should debounce initial input by 200ms', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const searchTerm = 'testing';
      const source$ = cold('a', { a: { target: { value: searchTerm } } });
      const final$ = source$.pipe(
        breweryTypeahead({
          getJSON: () => of(searchTerm).pipe(delay(200))
        })
      );
      const expected = '400ms a';

      expectObservable(final$).toBe(expected, { a: searchTerm });
    });
  });

  it('should cancel active requests if another value is emitted', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const searchTerm = 'testing';
      const source$ = cold('a 250ms b', { 
        a: { target: { value: 'first value' } },
        b: { target: { value: 'second value' } } 
      });
      const final$ = source$.pipe(
        breweryTypeahead({
          getJSON: () => of(searchTerm).pipe(delay(300))
        })
      );
      const expected = '751ms b';

      expectObservable(final$).toBe(expected, { b: searchTerm });
    });
  });

  it('should ignore duplicate values in a row', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const searchTerm = 'testing';
      const source$ = cold('a 250ms b', { 
        a: { target: { value: 'first value' } },
        b: { target: { value: 'first value' } } 
      });
      const final$ = source$.pipe(
        breweryTypeahead({
          getJSON: () => of(searchTerm).pipe(delay(300))
        })
      );
      const expected = '500ms b';

      expectObservable(final$).toBe(expected, { b: searchTerm });
    });
  });

  it('should ignore errors', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const source$ = cold('a 250ms b', { 
        a: { target: { value: 'first value' } },
        b: { target: { value: 'second value' } } 
      });
      const final$ = source$.pipe(
        breweryTypeahead({
          getJSON: () => throwError('error!')
        })
      );
      const expected = '';

      expectObservable(final$).toBe(expected);
    });
  });
});
