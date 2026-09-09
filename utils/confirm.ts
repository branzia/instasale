import { Alert } from 'react-native';

/**
 * Destructive-delete confirmation — was an identical inline `Alert.alert`
 * block duplicated between product-form.tsx and attribute-form.tsx. A plain
 * function rather than a component since it wraps a native `Alert.alert`
 * call, not JSX.
 */
export function confirmDelete(entityLabel: string, onConfirm: () => void) {
  Alert.alert(`Delete this ${entityLabel}?`, 'This cannot be undone.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
}
