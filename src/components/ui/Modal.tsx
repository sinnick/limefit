import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ViewStyle,
  TextStyle,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, shadows } from '../../constants/theme';
import { Button } from './Button';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

const sizeConfig = {
  sm: { maxHeight: SCREEN_HEIGHT * 0.3, width: '80%' },
  md: { maxHeight: SCREEN_HEIGHT * 0.5, width: '90%' },
  lg: { maxHeight: SCREEN_HEIGHT * 0.7, width: '95%' },
  full: { maxHeight: SCREEN_HEIGHT * 0.9, width: '100%' },
};

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeOnBackdrop = true,
  size = 'md',
}) => {
  const sizeStyle = sizeConfig[size];

  const overlayStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  };

  const containerStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderRadius: size === 'full' ? 0 : 24,
    maxHeight: sizeStyle.maxHeight,
    width: sizeStyle.width as any,
    ...shadows.lg,
  };

  const headerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: title ? 1 : 0,
    borderBottomColor: colors.border,
  };

  const titleStyle: TextStyle = {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: colors.textPrimary,
    flex: 1,
  };

  const contentStyle: ViewStyle = {
    padding: 20,
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={closeOnBackdrop ? onClose : undefined}>
        <View style={overlayStyle}>
          <TouchableWithoutFeedback>
            <View style={containerStyle}>
              {(title || showCloseButton) && (
                <View style={headerStyle}>
                  <Text style={titleStyle}>{title}</Text>
                  {showCloseButton && (
                    <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                      <Ionicons name="close" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
              <View style={contentStyle}>{children}</View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

// Confirmation Modal
interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  loading = false,
}) => {
  const messageStyle: TextStyle = {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  };

  const buttonsStyle: ViewStyle = {
    flexDirection: 'row',
    gap: 12,
  };

  return (
    <Modal visible={visible} onClose={onClose} title={title} size="sm">
      <Text style={messageStyle}>{message}</Text>
      <View style={buttonsStyle}>
        <Button
          title={cancelText}
          variant="secondary"
          onPress={onClose}
          style={{ flex: 1 }}
          disabled={loading}
        />
        <Button
          title={confirmText}
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onPress={onConfirm}
          style={{ flex: 1 }}
          loading={loading}
        />
      </View>
    </Modal>
  );
};

// Alert Modal (single button)
interface AlertModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  onClose,
  title,
  message,
  buttonText = 'Aceptar',
  icon,
  iconColor = colors.lime,
}) => {
  const iconContainerStyle: ViewStyle = {
    alignItems: 'center',
    marginBottom: 16,
  };

  const messageStyle: TextStyle = {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  };

  return (
    <Modal visible={visible} onClose={onClose} title={title} size="sm">
      {icon && (
        <View style={iconContainerStyle}>
          <Ionicons name={icon} size={48} color={iconColor} />
        </View>
      )}
      <Text style={messageStyle}>{message}</Text>
      <Button title={buttonText} variant="primary" onPress={onClose} fullWidth />
    </Modal>
  );
};

export default Modal;
