import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { getInitials } from '../utils/helpers';

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: number;
  style?: object;
}

export const Avatar: React.FC<AvatarProps> = ({ uri, name, size = 48, style }) => {
  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (uri) {
    // Check if it's a base64 image or a URL
    const imageSource = uri.startsWith('data:') || uri.startsWith('http') 
      ? { uri } 
      : { uri: `data:image/jpeg;base64,${uri}` };
    
    return (
      <Image
        source={imageSource}
        style={[styles.image, containerStyle, style]}
      />
    );
  }

  return (
    <View style={[styles.placeholder, containerStyle, style]}>
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#374151',
  },
  placeholder: {
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
