import React from 'react';
import renderer from 'react-test-renderer';

import { Announcement } from '../../types';
import { AnnouncementCard } from '../AnnouncementCard';

describe('AnnouncementCard', () => {
  const shortAnnouncement: Announcement = {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf1',
    title: 'Lunch is served',
    body: 'Head to the cafeteria for hot meals.',
    priority: 'normal',
    created_by: null,
    created_at: '2026-10-18T06:00:00.000Z',
  };

  const urgentLongAnnouncement: Announcement = {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf2',
    title: 'Urgent submission deadline update',
    body: 'Please note that GitHub repositories must be set to public before 11:00 AM IST tomorrow. Any private repositories will fail automated scoring checks. If you need assistance with git setup, our mentors in room 402 are ready to help you throughout the night.',
    priority: 'urgent',
    created_by: null,
    created_at: '2026-10-18T06:25:00.000Z',
  };

  const referenceNow = new Date('2026-10-18T06:30:00.000Z');

  it('renders title, priority badge, and relative timestamp', () => {
    let tree: renderer.ReactTestRenderer | null = null;
    renderer.act(() => {
      tree = renderer.create(
        <AnnouncementCard announcement={shortAnnouncement} now={referenceNow} />
      );
    });

    const root = tree!.root;
    expect(root.findByProps({ children: 'Lunch is served' })).toBeTruthy();
    expect(root.findByProps({ label: 'INFO' })).toBeTruthy();
    // 30 minutes difference -> "30m ago"
    expect(root.findByProps({ children: '30m ago' })).toBeTruthy();
  });

  it('renders URGENT badge and handles expandable text for long bodies', () => {
    let tree: renderer.ReactTestRenderer | null = null;
    renderer.act(() => {
      tree = renderer.create(
        <AnnouncementCard announcement={urgentLongAnnouncement} now={referenceNow} />
      );
    });

    const root = tree!.root;
    // 5 minutes difference -> "5m ago"
    expect(root.findByProps({ children: '5m ago' })).toBeTruthy();
    expect(root.findByProps({ label: 'URGENT' })).toBeTruthy();

    // Verify "Read more ▼" button exists
    const expandButton = root.findByProps({ accessibilityRole: 'button' });
    expect(expandButton).toBeTruthy();
    expect(root.findByProps({ children: 'Read more ▼' })).toBeTruthy();

    // Simulate press to expand
    renderer.act(() => {
      expandButton.props.onPress();
    });

    // Should now show "Show less ▲"
    expect(root.findByProps({ children: 'Show less ▲' })).toBeTruthy();

    // Simulate press to collapse
    renderer.act(() => {
      expandButton.props.onPress();
    });
    expect(root.findByProps({ children: 'Read more ▼' })).toBeTruthy();
  });

  it('does not display read more button when body text is short', () => {
    let tree: renderer.ReactTestRenderer | null = null;
    renderer.act(() => {
      tree = renderer.create(
        <AnnouncementCard announcement={shortAnnouncement} now={referenceNow} />
      );
    });

    const expandButtons = tree!.root.findAllByProps({ accessibilityRole: 'button' });
    expect(expandButtons).toHaveLength(0);
  });
});
