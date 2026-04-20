import React from 'react';
import { AddExpenseSheet } from './AddExpenseSheet';
import { AddRecurringSheet } from './AddRecurringSheet';
import { AddPlannedSheet } from './AddPlannedSheet';
import { AddIncomeSheet } from './AddIncomeSheet';
import { AddEnvelopeSheet } from './AddEnvelopeSheet';
import { EditEnvelopeSheet } from './EditEnvelopeSheet';
import { AddCategorySheet } from './AddCategorySheet';
import { EditCategorySheet } from './EditCategorySheet';
import { IncomeSheet } from './IncomeSheet';
import { AllocateSheet } from './AllocateSheet';

export function SheetHost() {
  return (
    <>
      <AddExpenseSheet />
      <AddRecurringSheet />
      <AddPlannedSheet />
      <AddIncomeSheet />
      <AddEnvelopeSheet />
      <EditEnvelopeSheet />
      <AddCategorySheet />
      <EditCategorySheet />
      <IncomeSheet />
      <AllocateSheet />
    </>
  );
}
