"use strict";

/**
 *  accommodation controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::accommodation.accommodation",
  ({ strapi }) => ({
    async delete(ctx) {
      const { id } = ctx.params;
      const entity = await strapi.entityService.findOne(
        "api::accommodation.accommodation",
        id,
        { populate: { cover: true, imagesRooms: true, bookings: true } }
      );
      const response = await super.delete(ctx);
      if (entity) {
        if (entity.imagesRooms.length > 0) {
          entity.imagesRooms.forEach((image) => {
            strapi.plugins.upload.services.upload.remove(image);
          });
        }
        if (entity.cover) {
          strapi.plugins.upload.services.upload.remove(entity.cover);
        }
        if (entity.bookings.length > 0) {
          const bookingEntities = await strapi.entityService.findMany(
            "api::booking.booking",
            {
              populate: { accommodation: true },
              filters: { accommodation: { id: id } },
            }
          );
          for (let booking of bookingEntities) {
            await strapi.db
              .query("api::booking.booking")
              .delete({ where: { id: booking.id } });
          }
        }
      }
      return response;
    },
    async update(ctx) {
      const { id } = ctx.params;
      const {
        body: {
          replaceCover = "",
          replaceRoomImages = [],
          renameCover = "",
          imagesToRename = [],
        },
      } = ctx.request;

      const entity = await strapi.entityService.findOne(
        "api::accommodation.accommodation",
        id,
        { populate: { cover: true, imagesRooms: true } }
      );
      if (entity) {
        if (typeof replaceRoomImages === "string") {
          const replaceArray = JSON.parse(replaceRoomImages);
          if (replaceArray.length > 0) {
            entity.imagesRooms.forEach((image) => {
              if (
                replaceArray.some(
                  (imageName) => imageName === image.name.split(".")[0]
                )
              ) {
                strapi.plugins.upload.services.upload.remove(image);
              }
            });
          }
        }
        if (typeof imagesToRename === "string") {
          const renameArray = JSON.parse(imagesToRename);
          if (renameArray.length > 0) {
            entity.imagesRooms.forEach((image) => {
              const newName = renameArray.find(
                (nameObj) => nameObj.from === image.name.split(".")[0]
              );
              if (newName) {
                const { name, id, ...rest } = image;
                strapi.plugins.upload.services.upload.update(id, {
                  name: `${newName.to}.${name.split(".")[1]}`,
                  ...rest,
                });
              }
            });
          }
        }
        if (replaceCover) {
          strapi.plugins.upload.services.upload.remove(entity.cover);
        }
        if (renameCover) {
          const { name, id, ...rest } = entity.cover;

          strapi.plugins.upload.services.upload.update(id, {
            name: `${renameCover}.${name.split(".")[1]}`,
            ...rest,
          });
        }
      }
      const response = await super.update(ctx);
      return response;
    },
  })
);
