/**
 * Auto-generated entity types
 * Contains all CMS collection interfaces in a single file 
 */

/**
 * Collection ID: clientgalleries
 * Interface for ClientGalleries
 */
export interface ClientGalleries {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  clientName?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  coverImage?: string;
  /** @wixFieldType text */
  accessCode?: string;
  /** @wixFieldType url */
  galleryLink?: string;
  /** @wixFieldType date */
  eventDate?: Date | string;
  /** @wixFieldType text */
  description?: string;
}


/**
 * Collection ID: faq
 * Interface for FrequentlyAskedQuestions
 */
export interface FrequentlyAskedQuestions {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  question?: string;
  /** @wixFieldType text */
  answer?: string;
  /** @wixFieldType text */
  category?: string;
  /** @wixFieldType number */
  displayOrder?: number;
  /** @wixFieldType boolean */
  isFeatured?: boolean;
}


/**
 * Collection ID: fineartgallery
 * Interface for FineArtGallery
 */
export interface FineArtGallery {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  title?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  image?: string;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType number */
  displayOrder?: number;
  /** @wixFieldType text */
  medium?: string;
  /** @wixFieldType number */
  yearCreated?: number;
}


/**
 * Collection ID: galleryphotos
 * Interface for GalleryPhotos
 */
export interface GalleryPhotos {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  title?: string;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  imageFile?: string;
  /** @wixFieldType text */
  galleryId?: string;
  /** @wixFieldType datetime */
  uploadDate?: Date | string;
}


/**
 * Collection ID: homepagegallery
 * Interface for HomepageGallery
 */
export interface HomepageGallery {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  image?: string;
  /** @wixFieldType text */
  title?: string;
  /** @wixFieldType text */
  altText?: string;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType number */
  order?: number;
  /** @wixFieldType url */
  link?: string;
}


/**
 * Collection ID: portraitgallery
 * Interface for PortraitGallery
 */
export interface PortraitGallery {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  image?: string;
  /** @wixFieldType text */
  title?: string;
  /** @wixFieldType text */
  altText?: string;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType date */
  dateTaken?: Date | string;
  /** @wixFieldType text */
  location?: string;
}


/**
 * Collection ID: published-photos-self
 * Interface for Publishedphotosself
 */
export interface Publishedphotosself {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  image?: string;
  /** @wixFieldType text */
  title?: string;
  /** @wixFieldType text */
  altText?: string;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType date */
  dateTaken?: Date | string;
  /** @wixFieldType text */
  location?: string;
}


/**
 * Collection ID: servicecategories
 * Interface for ServiceCategories
 */
export interface ServiceCategories {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  serviceName?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  coverImage?: string;
  /** @wixFieldType text */
  shortDescription?: string;
  /** @wixFieldType text */
  detailedDescription?: string;
  /** @wixFieldType text */
  slug?: string;
  /** @wixFieldType number */
  displayOrder?: number;
}
