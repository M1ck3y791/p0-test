///
/// Copyright © 2016-2022 The Thingsboard Authors
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import { Component, forwardRef, Input, OnDestroy } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormArray,
  FormBuilder,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
  Validators
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppState } from '@app/core/core.state';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Subject } from 'rxjs';
import { UtilsService } from '@core/services/utils.service';
import { NonConfirmedNotificationEscalation } from '@shared/models/notification.models';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'tb-escalations-component',
  templateUrl: './escalations.component.html',
  styleUrls: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EscalationsComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => EscalationsComponent),
      multi: true,
    }
  ]
})
export class EscalationsComponent implements ControlValueAccessor, Validator, OnDestroy {

  escalationsFormGroup: FormGroup;
  newEscalation = false;

  private requiredValue: boolean;
  get required(): boolean {
    return this.requiredValue;
  }
  @Input()
  set required(value: boolean) {
    this.requiredValue = coerceBooleanProperty(value);
  }

  @Input()
  disabled: boolean;

  private mainEscalaion = {
    delayInSec: 0,
    targets: null
  };

  private destroy$ = new Subject();

  private propagateChange = (v: any) => { };

  constructor(private store: Store<AppState>,
              private utils: UtilsService,
              private fb: FormBuilder) {
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  registerOnTouched(fn: any): void {
  }

  ngOnInit() {
    this.escalationsFormGroup = this.fb.group({
      escalations: this.fb.array([])
    });

    this.escalationsFormGroup.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => this.updateModel());
  }

  get escalationsFormArray(): FormArray {
    return this.escalationsFormGroup.get('escalations') as FormArray;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.disabled) {
      this.escalationsFormGroup.disable({emitEvent: false});
    } else {
      this.escalationsFormGroup.enable({emitEvent: false});
    }
  }

  writeValue(escalations: Array<NonConfirmedNotificationEscalation> | null): void {
    if (escalations?.length === this.escalationsFormArray.length) {
      this.escalationsFormArray.patchValue(escalations, {emitEvent: false});
    } else {
      const escalationsControls: Array<AbstractControl> = [];
      if (escalations) {
        escalations.forEach((escalation, index) => {
          escalationsControls.push(this.fb.control(escalation, [Validators.required]));
        });
      } else {
        escalationsControls.push(this.fb.control(this.mainEscalaion, [Validators.required]));
      }
      this.escalationsFormGroup.setControl('escalations', this.fb.array(escalationsControls), {emitEvent: false});
      if (this.disabled) {
        this.escalationsFormGroup.disable({emitEvent: false});
      } else {
        this.escalationsFormGroup.enable({emitEvent: false});
      }
    }
  }

  public removeEscalation(index: number) {
    (this.escalationsFormGroup.get('escalations') as FormArray).removeAt(index);
  }

  public addEscalation() {
    const escalation = {
      delayInSec: 0,
      targets: null
    };
    this.newEscalation = true;
    const escalationArray = this.escalationsFormGroup.get('escalations') as FormArray;
    escalationArray.push(this.fb.control(escalation, []));
    this.escalationsFormGroup.updateValueAndValidity();
    if (!this.escalationsFormGroup.valid) {
      this.updateModel();
    }
  }

  public validate(c: AbstractControl): ValidationErrors | null {
    return this.escalationsFormGroup.valid ? null : {
      escalation: {
        valid: false,
      },
    };
  }

  private updateModel() {
    const escalations = this.escalationsFormGroup.get('escalations').value;
    this.propagateChange(escalations);
  }
}
