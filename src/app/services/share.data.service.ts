import {Directive, OnDestroy, OnInit} from '@angular/core';

import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {untilDestroyed} from 'ngx-take-until-destroy';

/**
 * Service base class for any share data between components.
 *
 * Ex.:
 *    @Injectable({
        providedIn: 'root'
      })
      export class Foo extends ShareDataService<Object> {

        constructor() {
          super('bar');
        }
      }
 *
 * Using.:
 *    Setting data:
 *                fooService.setDataShared(value);
 *    Getting data (Observable):
 *                fooService.getCurrentData().subscribe((data) => {
 *                });
 *    Kill subscription:
 *                fooService.unsubscribe();
 */
@Directive()
export abstract class ShareDataService<T> implements OnInit, OnDestroy {
  /* The behaviour subject reference */
  private _dataShared = new BehaviorSubject(null);

  /* Subject unsubscribe reference */
  private unsubscribeSubject: Subject<void> = new Subject();

  /* Name for the share data service */
  private readonly _dataSharedName: string;

  /* Reference for the data observable */
  private currentDataShared = this._dataShared.asObservable();

  /**
   * Default class constructor.
   * @param string name
   */
  constructor(name: string) {
    this._dataSharedName = name;
  }

  /**
   * A lifecycle hook that is called after Angular has initialized all data-bound properties of a directive.
   * Define an ngOnInit() method to handle any additional initialization tasks.
   */
  ngOnInit(): void {
  }

  /**
   * A lifecycle hook that is called when a directive, pipe, or service is destroyed.
   * Use for any custom cleanup that needs to occur when the instance is destroyed.
   */
  ngOnDestroy(): void {
    this.unsubscribe();
  }

  /**
   * Set value for the data shared.
   * @param newValue: T the new value that will be inserted on the data shared.
   */
  public setDataShared(newValue: T): void {
    this._dataShared.next(newValue);
  }

  /**
   * Get current value.
   * @return: any
   */
  public getCurrentDataValue(): any {
    return this._dataShared.getValue();
  }

  /**
   * Get currentData.
   * @return: Observable<T>
   */
  public getCurrentData(): Observable<T> {
    return this.currentDataShared.pipe(takeUntil(this.unsubscribeSubject), untilDestroyed(this));
  }

  /**
   * Get dataSharedName value.
   * @return string with the value of the name.
   */
  public getDataSharedName(): string {
    return this._dataSharedName;
  }

  /**
   * Kill subscription when need.
   */
  public unsubscribe(): void {
    this.unsubscribeSubject.next();
    this.unsubscribeSubject.complete();
  }
}
