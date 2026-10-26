import { render } from '@testing-library/react-native';

import { EmptyScreen } from './EmptyScreen';

it('shows the title', async () => {
  const { getByText } = await render(<EmptyScreen title="Today" />);
  expect(getByText('Today')).toBeTruthy();
});
