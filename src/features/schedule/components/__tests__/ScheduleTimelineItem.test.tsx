import React from 'react';
import renderer from 'react-test-renderer';

import { ScheduleEvent } from '../../types';
import { ScheduleTimelineItem } from '../ScheduleTimelineItem';

describe('ScheduleTimelineItem', () => {
  const sampleEvent: ScheduleEvent = {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
    title: 'Keynote Speech',
    description: 'Welcome hackers to Prayatna 2026',
    location: 'Auditorium 1',
    event_type: 'ceremony',
    starts_at: '2026-10-18T04:30:00.000Z', // 10:00 AM IST
    ends_at: '2026-10-18T05:30:00.000Z', // 11:00 AM IST
    created_at: '2026-10-17T00:00:00.000Z',
  };

  it('renders event details, time range, category badge, and location', () => {
    let tree: renderer.ReactTestRenderer | null = null;
    renderer.act(() => {
      tree = renderer.create(<ScheduleTimelineItem event={sampleEvent} isCurrent={false} />);
    });

    const root = tree!.root;
    expect(root.findByProps({ children: 'Keynote Speech' })).toBeTruthy();
    expect(root.findByProps({ children: 'Welcome hackers to Prayatna 2026' })).toBeTruthy();
    expect(root.findByProps({ children: 'Auditorium 1' })).toBeTruthy();

    // Verify time range rendered in IST
    const timeNode = root.findByProps({ children: '10:00 AM – 11:00 AM' });
    expect(timeNode).toBeTruthy();
  });

  it('renders LIVE NOW badge when event is active', () => {
    let tree: renderer.ReactTestRenderer | null = null;
    renderer.act(() => {
      tree = renderer.create(<ScheduleTimelineItem event={sampleEvent} isCurrent={true} />);
    });

    const root = tree!.root;
    // Live badge should exist
    const liveBadge = root.findByProps({ label: 'LIVE NOW' });
    expect(liveBadge).toBeTruthy();
  });

  it('omits description and location gracefully when null', () => {
    const minimalEvent: ScheduleEvent = {
      ...sampleEvent,
      description: null,
      location: null,
    };

    let tree: renderer.ReactTestRenderer | null = null;
    renderer.act(() => {
      tree = renderer.create(<ScheduleTimelineItem event={minimalEvent} isCurrent={false} />);
    });

    expect(tree!.root.findByProps({ children: 'Keynote Speech' })).toBeTruthy();
  });
});
