import * as React from 'react';
import { Link as RouterLink, type LinkProps } from 'react-router';

// Filter out Figma inspector props that shouldn't be passed to DOM elements
const FilteredLink = React.forwardRef<
  HTMLAnchorElement,
  LinkProps & React.RefAttributes<HTMLAnchorElement>
>((props, ref) => {
  const filteredProps = Object.keys(props).reduce((acc, key) => {
    if (!key.startsWith('_fg')) {
      acc[key] = props[key as keyof typeof props];
    }
    return acc;
  }, {} as any);

  return <RouterLink ref={ref} {...filteredProps} />;
});

FilteredLink.displayName = 'FilteredLink';

export { FilteredLink as Link };
