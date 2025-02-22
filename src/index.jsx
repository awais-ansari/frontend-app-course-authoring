import 'core-js/stable';
import 'regenerator-runtime/runtime';

import {
  APP_INIT_ERROR, APP_READY, subscribe, initialize, mergeConfig,
} from '@edx/frontend-platform';
import { AppProvider, ErrorPage } from '@edx/frontend-platform/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Switch } from 'react-router-dom';

import { messages as footerMessages } from '@edx/frontend-component-footer';

import appMessages from './i18n';

import initializeStore from './store';
import './index.scss';
import CourseAuthoringRoutes from './CourseAuthoringRoutes';
import LegacyProctoringRoute from './proctored-exam-settings/LegacyProctoringRoute';

subscribe(APP_READY, () => {
  ReactDOM.render(
    <AppProvider store={initializeStore()}>
      <Switch>
        <Route
          exact
          path="/proctored-exam-settings/:courseId"
          render={({ match }) => {
            const { params: { courseId } } = match;
            /* See component for details on what this is */
            return (
              <LegacyProctoringRoute courseId={courseId} />
            );
          }}
        />
        <Route
          path="/course/:courseId"
          render={({ match }) => {
            const { params: { courseId } } = match;
            return (
              <CourseAuthoringRoutes courseId={courseId} />
            );
          }}
        />
      </Switch>
    </AppProvider>,
    document.getElementById('root'),
  );
});

subscribe(APP_INIT_ERROR, (error) => {
  ReactDOM.render(<ErrorPage message={error.message} />, document.getElementById('root'));
});

initialize({
  handlers: {
    config: () => {
      mergeConfig({
        SUPPORT_URL: process.env.SUPPORT_URL || null,
      }, 'CourseAuthoringConfig');
    },
  },
  messages: [
    appMessages,
    footerMessages,
  ],
  requireAuthenticatedUser: true,
});
