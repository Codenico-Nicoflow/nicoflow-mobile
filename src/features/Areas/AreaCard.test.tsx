import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { createAreaApi, createProjectApi } from '@nicoflow/shared/api';
import { type AreaWithProjects } from '@nicoflow/shared/api';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';

import { server } from '../../../test/server';

import { AreaCard } from './AreaCard';

jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));

const API = 'http://localhost:8080/v1';

const baseQuery = fetchBaseQuery({ baseUrl: API });
const mockAreaApi = createAreaApi(baseQuery);
const mockProjectApi = createProjectApi(baseQuery, mockAreaApi);

jest.mock('@/lib/store', () => ({
  useDeleteAreaMutation: () => mockAreaApi.useDeleteAreaMutation(),
  useUpdateProjectMutation: () => mockProjectApi.useUpdateProjectMutation(),
  useDeleteProjectMutation: () => mockProjectApi.useDeleteProjectMutation(),
}));

const makeStore = () =>
  configureStore({
    reducer: { [mockAreaApi.reducerPath]: mockAreaApi.reducer, [mockProjectApi.reducerPath]: mockProjectApi.reducer },
    middleware: gDM => gDM().concat(mockAreaApi.middleware, mockProjectApi.middleware),
  });

const area = (overrides: Partial<AreaWithProjects> = {}): AreaWithProjects => ({
  id: 'a1',
  name: 'Work',
  color: '#3B82F6',
  icon: 'briefcase',
  createdAt: '',
  updatedAt: '',
  projects: [
    { id: 'p1', areaId: 'a1', name: 'Alpha', status: 'active', folderIcon: 'folder', createdAt: '', updatedAt: '' },
  ],
  ...overrides,
});

const renderCard = async (props: Partial<Parameters<typeof AreaCard>[0]> = {}) => {
  const onEdit = jest.fn();
  const onPressProject = jest.fn();
  const onEditProject = jest.fn();
  const onAddProject = jest.fn();
  await render(
    <GestureHandlerRootView>
      <BottomSheetModalProvider>
        <Provider store={makeStore()}>
          <AreaCard
            area={area()}
            onPressProject={onPressProject}
            onEdit={onEdit}
            onEditProject={onEditProject}
            onAddProject={onAddProject}
            {...props}
          />
        </Provider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
  return { onEdit, onPressProject, onEditProject, onAddProject };
};

describe('AreaCard', () => {
  it('opens the actions menu and calls onEdit for Edit Area', async () => {
    const { onEdit } = await renderCard();

    await fireEvent.press(screen.getByLabelText('Area actions'));
    await waitFor(() => expect(screen.getByText('Edit Area')).toBeTruthy());
    await fireEvent.press(screen.getByText('Edit Area'));

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'a1' }));
  });

  it('shows the exact cascade-delete confirmation copy', async () => {
    await renderCard();

    // The AlertDialog's title + confirm button are already present in the
    // tree under the gorhom mock (content renders unconditionally), so
    // "Delete Area" appears 3 times: menu item [0], dialog title [1],
    // confirm button [2]. Pressing the menu item just makes the dialog
    // interactable — it's already mounted.
    await fireEvent.press(screen.getByLabelText('Area actions'));
    await fireEvent.press(screen.getAllByText('Delete Area')[0]);

    // The description renders as 3 sibling text nodes (before / bold name /
    // after) rather than one string, so assert each fragment individually —
    // together they reconstruct web's exact copy word-for-word. getAllByText
    // since the nested ProjectRow's own delete dialog shares the "Are you
    // sure you want to delete " prefix (mounted unconditionally under the
    // gorhom mock).
    await waitFor(() =>
      expect(screen.getAllByText('Are you sure you want to delete ', { exact: false }).length).toBeGreaterThan(0)
    );
    expect(screen.getAllByText('Work', { exact: true }).length).toBeGreaterThan(0);
    expect(screen.getByText('? All projects in this area will be permanently deleted.', { exact: false })).toBeTruthy();
  });

  it('deletes the area on confirm', async () => {
    let deleteCalled = false;
    server.use(
      http.delete(`${API}/areas/:id`, () => {
        deleteCalled = true;
        return HttpResponse.json({ data: null, error: null });
      })
    );
    await renderCard();

    // [0] = menu item, [1] = dialog title, [2] = confirm button (all mounted
    // unconditionally under the gorhom mock).
    await fireEvent.press(screen.getByLabelText('Area actions'));
    await fireEvent.press(screen.getAllByText('Delete Area')[0]);
    await fireEvent.press(screen.getAllByText('Delete Area')[2]);

    await waitFor(() => expect(deleteCalled).toBe(true));
  });
});
