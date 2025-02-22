import React from 'react';

import {
  act,
  queryByLabelText,
  queryByTestId,
  queryByText,
  render,
  screen,
  waitForElementToBeRemoved,
  queryByRole,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider, PageRoute } from '@edx/frontend-platform/react';
import { Switch } from 'react-router';

import {
  getConfig, history, initializeMockApp, setConfig,
} from '@edx/frontend-platform';
import MockAdapter from 'axios-mock-adapter';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import DiscussionsSettings from './DiscussionsSettings';
import PagesAndResourcesProvider from '../PagesAndResourcesProvider';
import initializeStore from '../../store';
import { getAppsUrl } from './data/api';
import { piazzaApiResponse } from './factories/mockApiResponses';

const courseId = 'course-v1:edX+TestX+Test_Course';

let axiosMock;
let store;
let container;

function renderComponent() {
  const wrapper = render(
    <AppProvider store={store}>
      <PagesAndResourcesProvider courseId={courseId}>
        <Switch>
          <PageRoute
            path={[
              `/course/${courseId}/pages-and-resources/discussions/configure/:appId`,
              `/course/${courseId}/pages-and-resources/discussions`,
            ]}
          >
            <DiscussionsSettings courseId={courseId} />
          </PageRoute>
        </Switch>
      </PagesAndResourcesProvider>
    </AppProvider>,
  );
  container = wrapper.container;
}

describe('DiscussionsSettings', () => {
  beforeEach(() => {
    initializeMockApp({
      authenticatedUser: {
        userId: 3,
        username: 'abc123',
        administrator: true,
        roles: [],
      },
    });

    store = initializeStore();
    axiosMock = new MockAdapter(getAuthenticatedHttpClient());

    // Leave the DiscussionsSettings route after the test.
    history.push(`/course/${courseId}/pages-and-resources`);
  });

  describe('with successful network connections', () => {
    beforeEach(() => {
      axiosMock.onGet(getAppsUrl(courseId)).reply(200, piazzaApiResponse);

      renderComponent();
    });

    test('sets selection step from routes', async () => {
      history.push(`/course/${courseId}/pages-and-resources/discussions`);

      // This is an important line that ensures the spinner has been removed - and thus our main
      // content has been loaded - prior to proceeding with our expectations.
      await waitForElementToBeRemoved(screen.getByRole('status'));

      expect(queryByTestId(container, 'appList')).toBeInTheDocument();
      expect(queryByTestId(container, 'appConfigForm')).not.toBeInTheDocument();
    });

    test('sets settings step from routes', async () => {
      history.push(`/course/${courseId}/pages-and-resources/discussions/configure/piazza`);

      // This is an important line that ensures the spinner has been removed - and thus our main
      // content has been loaded - prior to proceeding with our expectations.
      await waitForElementToBeRemoved(screen.getByRole('status'));

      expect(queryByTestId(container, 'appList')).not.toBeInTheDocument();
      expect(queryByTestId(container, 'appConfigForm')).toBeInTheDocument();
    });

    test('successfully advances to settings step for lti', async () => {
      history.push(`/course/${courseId}/pages-and-resources/discussions`);

      // This is an important line that ensures the spinner has been removed - and thus our main
      // content has been loaded - prior to proceeding with our expectations.
      await waitForElementToBeRemoved(screen.getByRole('status'));

      userEvent.click(queryByLabelText(container, 'Select Piazza'));
      userEvent.click(queryByText(container, 'Next'));

      expect(queryByTestId(container, 'appList')).not.toBeInTheDocument();
      expect(queryByTestId(container, 'appConfigForm')).toBeInTheDocument();
      expect(queryByTestId(container, 'ltiConfigForm')).toBeInTheDocument();
      expect(queryByTestId(container, 'legacyConfigForm')).not.toBeInTheDocument();
    });

    test('successfully advances to settings step for legacy', async () => {
      history.push(`/course/${courseId}/pages-and-resources/discussions`);

      // This is an important line that ensures the spinner has been removed - and thus our main
      // content has been loaded - prior to proceeding with our expectations.
      await waitForElementToBeRemoved(screen.getByRole('status'));

      userEvent.click(queryByLabelText(container, 'Select edX Discussions'));
      userEvent.click(queryByText(container, 'Next'));

      expect(queryByTestId(container, 'appList')).not.toBeInTheDocument();
      expect(queryByTestId(container, 'appConfigForm')).toBeInTheDocument();
      expect(queryByTestId(container, 'ltiConfigForm')).not.toBeInTheDocument();
      expect(queryByTestId(container, 'legacyConfigForm')).toBeInTheDocument();
    });

    test('successfully goes back to first step', async () => {
      history.push(`/course/${courseId}/pages-and-resources/discussions/configure/piazza`);

      // This is an important line that ensures the spinner has been removed - and thus our main
      // content has been loaded - prior to proceeding with our expectations.
      await waitForElementToBeRemoved(screen.getByRole('status'));

      expect(queryByTestId(container, 'appConfigForm')).toBeInTheDocument();

      userEvent.click(queryByText(container, 'Back'));

      expect(queryByTestId(container, 'appList')).toBeInTheDocument();
      expect(queryByTestId(container, 'appConfigForm')).not.toBeInTheDocument();
    });

    test('successfully closes the modal', async () => {
      history.push(`/course/${courseId}/pages-and-resources/discussions`);

      // This is an important line that ensures the spinner has been removed - and thus our main
      // content has been loaded - prior to proceeding with our expectations.
      await waitForElementToBeRemoved(screen.getByRole('status'));

      expect(queryByTestId(container, 'appList')).toBeInTheDocument();

      userEvent.click(queryByLabelText(container, 'Close'));

      expect(queryByTestId(container, 'appList')).not.toBeInTheDocument();
      expect(queryByTestId(container, 'appConfigForm')).not.toBeInTheDocument();

      expect(window.location.pathname).toEqual(`/course/${courseId}/pages-and-resources`);
    });

    test('successfully submit the modal', async () => {
      history.push(`/course/${courseId}/pages-and-resources/discussions`);

      axiosMock.onPost(getAppsUrl(courseId)).reply(200, piazzaApiResponse);

      // This is an important line that ensures the spinner has been removed - and thus our main
      // content has been loaded - prior to proceeding with our expectations.
      await waitForElementToBeRemoved(screen.getByRole('status'));

      userEvent.click(queryByLabelText(container, 'Select Piazza'));
      userEvent.click(queryByText(container, 'Next'));
      // Apply causes an async action to take place
      act(() => {
        userEvent.click(queryByText(container, 'Apply'));
      });

      // This is an important line that ensures the Close button has been removed, which implies that
      // the full screen modal has been closed following our click of Apply.  Once this has happened,
      // then it's safe to proceed with our expectations.
      await waitForElementToBeRemoved(screen.queryByLabelText('Close'));

      expect(window.location.pathname).toEqual(`/course/${courseId}/pages-and-resources`);
    });
  });

  describe('with network error fetchApps API requests', () => {
    beforeEach(() => {
      // Expedient way of getting SUPPORT_URL into config.
      setConfig({
        ...getConfig(),
        SUPPORT_URL: 'http://support.edx.org',
      });

      axiosMock.onGet(getAppsUrl(courseId)).networkError();

      renderComponent();
    });

    test('shows connection error alert', async () => {
      history.push(`/course/${courseId}/pages-and-resources/discussions`);

      // This is an important line that ensures the spinner has been removed - and thus our main
      // content has been loaded - prior to proceeding with our expectations.
      await waitForElementToBeRemoved(screen.getByRole('status'));

      const alert = queryByRole(container, 'alert');
      expect(alert).toBeInTheDocument();
      expect(alert.textContent).toEqual(expect.stringContaining('We encountered a technical error when loading this page.'));
      expect(alert.innerHTML).toEqual(expect.stringContaining(getConfig().SUPPORT_URL));
    });
  });

  describe('with network error postAppConfig API requests', () => {
    beforeEach(() => {
      // Expedient way of getting SUPPORT_URL into config.
      setConfig({
        ...getConfig(),
        SUPPORT_URL: 'http://support.edx.org',
      });

      axiosMock.onGet(getAppsUrl(courseId)).reply(200, piazzaApiResponse);
      axiosMock.onPost(getAppsUrl(courseId)).networkError();
      renderComponent();
    });

    test('shows connection error alert at top of form', async () => {
      history.push(`/course/${courseId}/pages-and-resources/discussions/configure/piazza`);

      // This is an important line that ensures the spinner has been removed - and thus our main
      // content has been loaded - prior to proceeding with our expectations.
      await waitForElementToBeRemoved(screen.getByRole('status'));

      // Apply causes an async action to take place
      act(() => {
        userEvent.click(queryByText(container, 'Apply'));
      });

      await waitFor(() => expect(axiosMock.history.post.length).toBe(1));

      expect(queryByTestId(container, 'appConfigForm')).toBeInTheDocument();

      const alert = queryByRole(container, 'alert');
      expect(alert).toBeInTheDocument();
      expect(alert.textContent).toEqual(expect.stringContaining('We encountered a technical error when applying changes.'));
      expect(alert.innerHTML).toEqual(expect.stringContaining(getConfig().SUPPORT_URL));
    });
  });

  describe('with permission denied error for fetchApps API requests', () => {
    beforeEach(() => {
      axiosMock.onGet(getAppsUrl(courseId)).reply(403);

      renderComponent();
    });

    test('shows permission denied alert', async () => {
      history.push(`/course/${courseId}/pages-and-resources/discussions`);

      // This is an important line that ensures the spinner has been removed - and thus our main
      // content has been loaded - prior to proceeding with our expectations.
      await waitForElementToBeRemoved(screen.getByRole('status'));

      const alert = queryByRole(container, 'alert');
      expect(alert).toBeInTheDocument();
      expect(alert.textContent).toEqual(expect.stringContaining('You are not authorized to view this page.'));
    });
  });

  describe('with permission denied error for postAppConfig API requests', () => {
    beforeEach(() => {
      axiosMock.onGet(getAppsUrl(courseId)).reply(200, piazzaApiResponse);
      axiosMock.onPost(getAppsUrl(courseId)).reply(403);

      renderComponent();
    });

    test('shows permission denied alert at top of form', async () => {
      history.push(`/course/${courseId}/pages-and-resources/discussions/configure/piazza`);

      // This is an important line that ensures the spinner has been removed - and thus our main
      // content has been loaded - prior to proceeding with our expectations.
      await waitForElementToBeRemoved(screen.getByRole('status'));

      // Apply causes an async action to take place
      act(() => {
        userEvent.click(queryByText(container, 'Apply'));
      });

      await waitFor(() => expect(axiosMock.history.post.length).toBe(1));

      expect(queryByTestId(container, 'appList')).not.toBeInTheDocument();
      expect(queryByTestId(container, 'appConfigForm')).not.toBeInTheDocument();

      // We don't technically leave the route in this case, though the modal is hidden.
      expect(window.location.pathname).toEqual(`/course/${courseId}/pages-and-resources/discussions/configure/piazza`);

      const alert = queryByRole(container, 'alert');
      expect(alert).toBeInTheDocument();
      expect(alert.textContent).toEqual(expect.stringContaining('You are not authorized to view this page.'));
    });
  });
});
