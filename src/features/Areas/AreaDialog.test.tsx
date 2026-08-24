import { createRef } from 'react';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { createAreaApi } from '@nicoflow/shared/api';
import { type IArea } from '@nicoflow/shared/types';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';

import { server } from '../../../test/server';

import { AreaDialog, type AreaDialogRef } from './AreaDialog';

jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));

const API = 'http://localhost:8080/v1';

const baseQuery = fetchBaseQuery({ baseUrl: API });
const mockAreaApi = createAreaApi(baseQuery);

jest.mock('@/lib/store', () => ({
  useCreateAreaMutation: () => mockAreaApi.useCreateAreaMutation(),
  useUpdateAreaMutation: () => mockAreaApi.useUpdateAreaMutation(),
}));

const makeStore = () =>
  configureStore({
    reducer: { [mockAreaApi.reducerPath]: mockAreaApi.reducer },
    middleware: gDM => gDM().concat(mockAreaApi.middleware),
  });

const area = (overrides: Partial<IArea> = {}): IArea => ({
  id: 'a1',
  name: 'Work',
  color: '#3B82F6',
  icon: 'briefcase',
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

const renderDialog = async (onSaved = jest.fn()) => {
  const ref = createRef<AreaDialogRef>();
  await render(
    <GestureHandlerRootView>
      <BottomSheetModalProvider>
        <Provider store={makeStore()}>
          <AreaDialog ref={ref} onSaved={onSaved} />
        </Provider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
  return { ref, onSaved };
};

describe('AreaDialog', () => {
  it('create mode shows the create title and default field values', async () => {
    const { ref } = await renderDialog();
    await waitFor(() => ref.current?.present());

    await waitFor(() => expect(screen.getByText('Create New Area')).toBeTruthy());
    expect(screen.getByText('Add a new Area to organize your projects')).toBeTruthy();
  });

  it('edit mode pre-fills from the area and disables Save until dirty', async () => {
    const { ref } = await renderDialog();
    await waitFor(() => ref.current?.present(area({ name: 'Personal' })));

    await waitFor(() => expect(screen.getByText('Edit Area')).toBeTruthy());
    expect(screen.getByDisplayValue('Personal')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save Changes' }).props.accessibilityState.disabled).toBe(true);
  });

  it('blocks submit with the exact web copy when the name is empty', async () => {
    const { ref } = await renderDialog();
    await waitFor(() => ref.current?.present());
    await waitFor(() => expect(screen.getByText('Create New Area')).toBeTruthy());

    await fireEvent.press(screen.getByText('Create'));

    await waitFor(() => expect(screen.getByText('Area name is required')).toBeTruthy());
  });

  it('blocks submit with the exact web copy when the name exceeds 30 characters', async () => {
    const { ref } = await renderDialog();
    await waitFor(() => ref.current?.present());
    await waitFor(() => expect(screen.getByText('Create New Area')).toBeTruthy());

    await fireEvent.changeText(screen.getByPlaceholderText('Enter area name'), 'x'.repeat(31));
    await fireEvent.press(screen.getByText('Create'));

    await waitFor(() => expect(screen.getByText('Area name must be less than 30 characters')).toBeTruthy());
  });

  it('creates an area and calls onSaved on success', async () => {
    server.use(http.post(`${API}/areas`, () => HttpResponse.json({ data: area({ name: 'Health' }), error: null })));
    const { ref, onSaved } = await renderDialog();
    await waitFor(() => ref.current?.present());
    await waitFor(() => expect(screen.getByText('Create New Area')).toBeTruthy());

    await fireEvent.changeText(screen.getByPlaceholderText('Enter area name'), 'Health');
    await fireEvent.press(screen.getByText('Create'));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it('shows the plan-limit alert on PLAN_LIMIT_EXCEEDED instead of a retry toast', async () => {
    server.use(
      http.post(`${API}/areas`, () =>
        HttpResponse.json({ data: null, error: { code: 'PLAN_LIMIT_EXCEEDED', message: 'limit' } }, { status: 403 })
      )
    );
    const { ref } = await renderDialog();
    await waitFor(() => ref.current?.present());
    await waitFor(() => expect(screen.getByText('Create New Area')).toBeTruthy());

    await fireEvent.changeText(screen.getByPlaceholderText('Enter area name'), 'Fourth Area');
    await fireEvent.press(screen.getByText('Create'));

    await waitFor(() => expect(screen.getByText("You've hit your Free limit")).toBeTruthy());
  });
});
