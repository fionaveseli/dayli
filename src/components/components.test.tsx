import { fireEvent, render } from '@testing-library/react-native';

import { Button, Checkbox, Chip, Segmented, Text, Toggle } from '.';
import { ThemeProvider } from '../theme';

const wrap = (ui: React.ReactElement, scheme?: 'light' | 'dark') =>
  render(<ThemeProvider scheme={scheme}>{ui}</ThemeProvider>);

it('Button calls onPress unless disabled', async () => {
  const onPress = jest.fn();
  const { getByText, rerender } = await wrap(<Button label="Approve" onPress={onPress} />);
  await fireEvent.press(getByText('Approve'));
  expect(onPress).toHaveBeenCalledTimes(1);
  await rerender(
    <ThemeProvider>
      <Button label="Approve" onPress={onPress} disabled />
    </ThemeProvider>,
  );
  await fireEvent.press(getByText('Approve'));
  expect(onPress).toHaveBeenCalledTimes(1);
});

it('Chip reports selected state', async () => {
  const { getByRole } = await wrap(<Chip label="Work" on />);
  expect(getByRole('button', { selected: true })).toBeTruthy();
});

it('Segmented changes value', async () => {
  const onChange = jest.fn();
  const { getByText } = await wrap(
    <Segmented
      value="visual"
      onChange={onChange}
      options={[
        { value: 'visual', label: 'Visual day' },
        { value: 'list', label: 'Checklist' },
      ]}
    />,
  );
  await fireEvent.press(getByText('Checklist'));
  expect(onChange).toHaveBeenCalledWith('list');
});

it('Checkbox and Toggle flip the value', async () => {
  const onCheck = jest.fn();
  const onToggle = jest.fn();
  const { getByRole } = await wrap(
    <>
      <Checkbox checked={false} onChange={onCheck} label="Done" />
      <Toggle value onChange={onToggle} label="Autopilot" />
    </>,
  );
  await fireEvent.press(getByRole('checkbox'));
  await fireEvent.press(getByRole('switch'));
  expect(onCheck).toHaveBeenCalledWith(true);
  expect(onToggle).toHaveBeenCalledWith(false);
});

it('Text uses the dark palette in dark mode', async () => {
  const { getByText } = await wrap(<Text>Hi</Text>, 'dark');
  expect(getByText('Hi').props.style).toEqual(
    expect.arrayContaining([expect.objectContaining({ color: '#F3EEE9' })]),
  );
});
