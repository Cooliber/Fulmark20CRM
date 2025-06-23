import { CurrentWorkspaceMemberFavoritesFolders } from '@/favorites/components/CurrentWorkspaceMemberFavoritesFolders';
import { WorkspaceFavorites } from '@/favorites/components/WorkspaceFavorites';
import { NavigationDrawerOpenedSection } from '@/object-metadata/components/NavigationDrawerOpenedSection';
import { RemoteNavigationDrawerSection } from '@/object-metadata/components/RemoteNavigationDrawerSection';
import { HvacNavigationSection } from '@/hvac/components/navigation/HvacNavigationSection';
import styled from '@emotion/styled';

const StyledScrollableItemsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
`;

export const MainNavigationDrawerScrollableItems = () => {
  return (
    <StyledScrollableItemsContainer>
      <NavigationDrawerOpenedSection />
      <HvacNavigationSection />
      <CurrentWorkspaceMemberFavoritesFolders />
      <WorkspaceFavorites />
      <RemoteNavigationDrawerSection />
    </StyledScrollableItemsContainer>
  );
};
