type PickerOptions = {
  mediaType?: "photo" | "video" | "mixed";
};

type PickerAsset = {
  uri: string;
  type: string;
  fileName: string;
  file: File;
};

type PickerResponse = {
  assets?: PickerAsset[];
  didCancel?: boolean;
};

type PickerCallback = (response: PickerResponse) => void;

const openPicker = (
  options: PickerOptions,
  callback?: PickerCallback,
  useCamera = false,
) => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept =
    options.mediaType === "video"
      ? "video/*"
      : options.mediaType === "mixed"
        ? "image/*,video/*"
        : "image/*";

  if (useCamera) {
    input.setAttribute("capture", "environment");
  }

  input.addEventListener(
    "change",
    () => {
      const file = input.files?.[0];

      if (!file) {
        callback?.({ didCancel: true });
        return;
      }

      callback?.({
        assets: [
          {
            uri: URL.createObjectURL(file),
            type: file.type,
            fileName: file.name,
            file,
          },
        ],
      });
    },
    { once: true },
  );

  input.click();
};

export const launchImageLibrary = (
  options: PickerOptions,
  callback?: PickerCallback,
) => openPicker(options, callback);

export const launchCamera = (
  options: PickerOptions,
  callback?: PickerCallback,
) => openPicker(options, callback, true);
