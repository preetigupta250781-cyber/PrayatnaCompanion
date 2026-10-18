import React from 'react';
import renderer from 'react-test-renderer';

import {
  AnnouncementListSkeleton,
  BusRouteListSkeleton,
  HomeSkeleton,
  LeaderboardSkeleton,
  ProblemCardSkeleton,
  ProfileCardSkeleton,
  ScheduleSkeleton,
} from '../composed-skeletons';
import { Skeleton } from '../skeleton';

describe('Skeleton Primitive & Composed Skeletons', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders Skeleton primitive with custom dimensions', () => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<Skeleton width={150} height={24} borderRadius={12} />);
    });

    const root = tree.root;
    expect(root.findByType(Skeleton)).toBeTruthy();

    renderer.act(() => {
      tree.unmount();
    });
  });

  it('renders HomeSkeleton layout', () => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<HomeSkeleton />);
    });
    expect(tree.root.findAllByType(Skeleton).length).toBeGreaterThan(5);
    renderer.act(() => tree.unmount());
  });

  it('renders ScheduleSkeleton layout', () => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<ScheduleSkeleton />);
    });
    expect(tree.root.findAllByType(Skeleton).length).toBeGreaterThan(5);
    renderer.act(() => tree.unmount());
  });

  it('renders AnnouncementListSkeleton layout', () => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<AnnouncementListSkeleton />);
    });
    expect(tree.root.findAllByType(Skeleton).length).toBeGreaterThan(5);
    renderer.act(() => tree.unmount());
  });

  it('renders ProblemCardSkeleton layout', () => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<ProblemCardSkeleton />);
    });
    expect(tree.root.findAllByType(Skeleton).length).toBeGreaterThan(5);
    renderer.act(() => tree.unmount());
  });

  it('renders LeaderboardSkeleton layout', () => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<LeaderboardSkeleton />);
    });
    expect(tree.root.findAllByType(Skeleton).length).toBeGreaterThan(5);
    renderer.act(() => tree.unmount());
  });

  it('renders BusRouteListSkeleton layout', () => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<BusRouteListSkeleton />);
    });
    expect(tree.root.findAllByType(Skeleton).length).toBeGreaterThan(5);
    renderer.act(() => tree.unmount());
  });

  it('renders ProfileCardSkeleton layout', () => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<ProfileCardSkeleton />);
    });
    expect(tree.root.findAllByType(Skeleton).length).toBeGreaterThan(5);
    renderer.act(() => tree.unmount());
  });
});
