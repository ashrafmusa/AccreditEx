import {
  archiveNotification,
  createNotification,
  deleteNotification,
  deleteNotificationsForUser,
  getNotificationsForUser,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  markNotificationsAsRead,
} from "@/services/notificationServiceFirebase";
import { notificationService } from "@/services/notificationService";
import { Notification } from "@/types";

jest.mock("@/services/notificationServiceFirebase", () => ({
  archiveNotification: jest.fn(),
  createNotification: jest.fn(),
  deleteNotification: jest.fn(),
  deleteNotificationsForUser: jest.fn(),
  getNotificationsForUser: jest.fn(),
  markAllNotificationsAsRead: jest.fn(),
  markNotificationAsRead: jest.fn(),
  markNotificationsAsRead: jest.fn(),
}));

const firebaseNotifications = {
  archiveNotification: jest.mocked(archiveNotification),
  createNotification: jest.mocked(createNotification),
  deleteNotification: jest.mocked(deleteNotification),
  deleteNotificationsForUser: jest.mocked(deleteNotificationsForUser),
  getNotificationsForUser: jest.mocked(getNotificationsForUser),
  markAllNotificationsAsRead: jest.mocked(markAllNotificationsAsRead),
  markNotificationAsRead: jest.mocked(markNotificationAsRead),
  markNotificationsAsRead: jest.mocked(markNotificationsAsRead),
};

describe("notificationService persistence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("persists notifications before adding them to the in-memory cache", async () => {
    // Arrange
    firebaseNotifications.createNotification.mockResolvedValue("firestore-id");

    // Act
    const created = await notificationService.createNotification(
      "notification-user",
      "Saved",
      "Persist this notice",
    );

    // Assert
    expect(firebaseNotifications.createNotification).toHaveBeenCalledWith(
      "notification-user",
      expect.objectContaining({ title: "Saved", message: "Persist this notice" }),
    );
    expect(created.id).toBe("firestore-id");
    expect(
      notificationService.getNotifications("notification-user"),
    ).toContainEqual(created);
  });

  it("hydrates persisted notifications for the requested user", async () => {
    // Arrange
    const notification: Notification = {
      id: "stored-id",
      userId: "hydrated-user",
      title: "Stored",
      message: "Loaded from Firestore",
      type: "info",
      read: false,
      archived: false,
      timestamp: new Date(),
    };
    firebaseNotifications.getNotificationsForUser.mockResolvedValue([notification]);

    // Act
    await notificationService.hydrateNotifications("hydrated-user");

    // Assert
    expect(
      notificationService.getNotifications("hydrated-user"),
    ).toEqual([expect.objectContaining({ id: "stored-id", title: "Stored" })]);
  });

  it("does not report a notification as read until Firestore confirms the update", async () => {
    // Arrange
    firebaseNotifications.createNotification.mockResolvedValue("read-test-id");
    const notification = await notificationService.createNotification(
      "read-test-user",
      "Unread",
      "Read me",
    );
    firebaseNotifications.markNotificationAsRead.mockRejectedValue(
      new Error("permission denied"),
    );

    // Act / Assert
    await expect(
      notificationService.markAsRead(notification.id),
    ).rejects.toThrow("permission denied");
    expect(notification.read).toBe(false);
  });
});
