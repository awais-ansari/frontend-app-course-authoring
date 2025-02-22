import React, { useCallback, useContext } from 'react';
import { useSelector } from 'react-redux';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { StatefulButton } from '@edx/paragon';

import messages from './messages';
import { SAVING } from '../data/slice';
import { AppConfigFormContext } from './AppConfigFormProvider';

function AppConfigFormApplyButton({ intl }) {
  const saveStatus = useSelector(state => state.discussions.saveStatus);
  const { formRef } = useContext(AppConfigFormContext);

  const submitButtonState = saveStatus === SAVING ? 'pending' : 'default';

  // This causes the form to be submitted from a button outside the form.
  const handleApply = useCallback(() => {
    formRef.current.requestSubmit();
  }, [formRef]);

  return (
    <StatefulButton
      labels={{
        default: intl.formatMessage(messages.applyButton),
        pending: intl.formatMessage(messages.applyingButton),
        complete: intl.formatMessage(messages.appliedButton),
      }}
      state={submitButtonState}
      className="mr-2"
      onClick={handleApply}
    />
  );
}

AppConfigFormApplyButton.propTypes = {
  intl: intlShape.isRequired,
};

export default injectIntl(AppConfigFormApplyButton);
