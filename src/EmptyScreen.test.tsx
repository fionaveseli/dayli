import { render } from '@testing-library/react-native';

import { EmptyScreen } from './EmptyScreen';
import { ThemeProvider } from './theme';

it('shows the title', async () => {
  const { getByText } = await render(
    <ThemeProvider>
      <EmptyScreen title="Today" />
    </ThemeProvider>,
  );
  expect(getByText('Today')).toBeTruthy();
});
