const Photo = require('../models/photo.model');
const Voter = require('../models/voter.model');
/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;
    const checkMail = new RegExp(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'g');
    const validatedMail = checkMail.test(email);
    const onlyLetters =  /^[a-zA-Z]+$/;
    const validatedTitle = onlyLetters.test(title)
    const validatedAuthor = onlyLetters.test(author)
   
    if (title && author && email && file) { // if fields are not empty...
      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];
      if((fileExt === "jpg" || fileExt === "png" || fileExt === "gif")  && author.length <= 50
      && title.length <= 25 &&  validatedAuthor && validatedMail && validatedTitle ){
      const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
      await newPhoto.save(); // ...save new photo in DB
      res.json(newPhoto);
    }
    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }
};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {
  try {
    //Did user vote before?
    const user = await Voter.findOne({ user: req.clientIp });
   
    if (user) {
      //User voted before - check for what pictures
      const voterToUpdate = await Voter.findOne({ $and: [{ user: req.clientIp, votes: req.params.id }] });
      //Alow user to vote for picture that is not saved in DB and then save that photo in his DB
      if (!voterToUpdate) {
        await Voter.updateOne({ user: req.clientIp }, { $push: { votes: [req.params.id] } });
        const photoToUpdate = await Photo.findOne({ _id: req.params.id });
        photoToUpdate.votes++;
        photoToUpdate.save();
        res.send({ message: 'OK' });
        // Dont allow user to vote for photo second time
      } else {
        res.status(500).json(err);
      }
    //New user - create and save him in DB along side with his vote
    } else {
      const newVoter = new Voter({ user: req.clientIp, votes: [req.params.id] });
      await newVoter.save();
      const photoToUpdate = await Photo.findOne({ _id: req.params.id });
      photoToUpdate.votes++;
      photoToUpdate.save();
      res.send({ message: 'OK' });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};