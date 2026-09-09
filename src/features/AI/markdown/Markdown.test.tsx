import { Linking } from 'react-native';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { Markdown } from './Markdown';

describe('Markdown rendering', () => {
  it('renders assistant text', async () => {
    await render(<Markdown content="Hello **there**" testID="md" />);

    expect(screen.getByText('Hello ')).toBeTruthy();
    expect(screen.getByText('there')).toBeTruthy();
  });

  it('renders no Image node for a markdown image, keeping only its alt text', async () => {
    const view = await render(<Markdown content="![a cat](https://evil.test/pixel.png)" testID="md" />);

    expect(screen.getByText('a cat')).toBeTruthy();
    // The URL must not survive anywhere in the tree. Asserting on the whole
    // serialized output rather than just querying for <Image> catches every
    // node type a leaked href could hide in.
    const tree = JSON.stringify(view.toJSON());
    expect(tree).not.toContain('evil.test');
    expect(tree).not.toContain('"Image"');
  });

  it('shows raw html as literal text rather than interpreting it', async () => {
    await render(<Markdown content="<script>alert(1)</script>" testID="md" />);

    expect(screen.getByText('<script>alert(1)</script>')).toBeTruthy();
  });

  it('opens a safe http(s) link', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await render(<Markdown content="[docs](https://nicoflow.app)" testID="md" />);

    await fireEvent.press(screen.getByText('docs'));

    expect(openURL).toHaveBeenCalledWith('https://nicoflow.app');
    openURL.mockRestore();
  });

  it('never hands an unsafe scheme to the OS — the link is not pressable at all', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await render(<Markdown content="[click](javascript:alert(1))" testID="md" />);

    await fireEvent.press(screen.getByText('click'));

    expect(openURL).not.toHaveBeenCalled();
    openURL.mockRestore();
  });
});
