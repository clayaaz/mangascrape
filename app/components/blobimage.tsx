import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";

const BlobImage = ({ url, headers = {} }) => {
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let objectUrl = null;

    const load = async () => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = () => {
          let uri = reader.result.replace(
            "data:application/octet-stream",
            "data:image/jpeg",
          );
          Image.getSize(uri, (width, height) => {
            setImageData({ uri: uri, width: width, height: height });
          });
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();

    // Cleanup blob URL on unmount
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (error) return <Text>Error: {error}</Text>;
  if (loading || imageData == null) return <ActivityIndicator />;
  return (
    <View>
      <Image
        source={{ uri: imageData.uri }}
        style={{
          width: "100%",
          aspectRatio: imageData.width / imageData.height,
          height: undefined,
        }}
        resizeMode="contain"
      />
    </View>
  );
};

export default BlobImage;
